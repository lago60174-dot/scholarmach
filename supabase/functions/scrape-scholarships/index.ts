import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SCHOLARSHIP_SOURCES = [
  {
    name: 'Campus France',
    url: 'https://www.campusfrance.org/fr/bourses',
    country: 'France',
    type: 'government'
  },
  {
    name: 'DAAD Germany',
    url: 'https://www.daad.de/en/study-and-research-in-germany/scholarships/',
    country: 'Germany',
    type: 'government'
  },
  {
    name: 'Study UK',
    url: 'https://www.study-uk.britishcouncil.org/scholarships',
    country: 'UK',
    type: 'government'
  },
  {
    name: 'Scholars4Dev',
    url: 'https://www.scholars4dev.com/',
    country: 'Multiple',
    type: 'portal'
  },
  {
    name: 'ScholarshipPortal',
    url: 'https://www.scholarshipportal.com/scholarships',
    country: 'Multiple',
    type: 'portal'
  }
];

interface ScholarshipData {
  title: string;
  description: string;
  country: string;
  deadline?: string;
  amount?: number;
  currency?: string;
  application_link?: string;
  field_of_study?: string;
  education_level?: string;
  scholarship_type?: string;
  language?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    if (!DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY not configured');
    }

    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    const { sourceUrl, sourceName } = await req.json();

    console.log(`🔍 Starting scrape for: ${sourceName || 'all sources'}`);

    const results = {
      total: 0,
      success: 0,
      failed: 0,
      scholarships: [] as any[]
    };

    const sourcesToScrape = sourceUrl 
      ? [{ name: sourceName, url: sourceUrl, country: 'Unknown', type: 'custom' }]
      : SCHOLARSHIP_SOURCES;

    for (const source of sourcesToScrape) {
      try {
        console.log(`📡 Crawling ${source.name}...`);

        // Call Firecrawl API to scrape the page
        const crawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: source.url,
            formats: ['markdown', 'html'],
            onlyMainContent: true,
            waitFor: 2000
          }),
        });

        if (!crawlResponse.ok) {
          console.error(`❌ Failed to crawl ${source.name}: ${crawlResponse.status}`);
          results.failed++;
          continue;
        }

        const crawlData = await crawlResponse.json();
        const content = crawlData.data?.markdown || crawlData.data?.html || '';

        if (!content) {
          console.log(`⚠️ No content found for ${source.name}`);
          results.failed++;
          continue;
        }

        // Parse scholarships from content using AI
        const scholarships = await parseScholarshipsWithAI(content, source, DEEPSEEK_API_KEY);

        // Save to database
        for (const scholarship of scholarships) {
          const { error } = await supabase
            .from('bourses')
            .upsert({
              title: scholarship.title,
              description: scholarship.description,
              country: source.country,
              target_countries: scholarship.country ? [scholarship.country] : null,
              deadline: scholarship.deadline || null,
              amount: scholarship.amount || null,
              currency: scholarship.currency || 'USD',
              application_link: scholarship.application_link || source.url,
              field_of_study: scholarship.field_of_study || null,
              education_level: scholarship.education_level || null,
              scholarship_type: scholarship.scholarship_type || null,
              language: scholarship.language || 'en',
              is_approved: false,
              is_active: true
            }, {
              onConflict: 'title',
              ignoreDuplicates: true
            });

          if (error) {
            console.error(`❌ Error saving scholarship: ${error.message}`);
          } else {
            results.success++;
            results.scholarships.push(scholarship.title);
          }
        }

        results.total += scholarships.length;
        console.log(`✅ Scraped ${scholarships.length} scholarships from ${source.name}`);

      } catch (error) {
        console.error(`❌ Error processing ${source.name}:`, error);
        results.failed++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`🎉 Scraping complete: ${results.success} saved, ${results.failed} failed`);

    return new Response(JSON.stringify({
      success: true,
      message: `Scraped ${results.total} scholarships. ${results.success} saved successfully.`,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Scraping error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function parseScholarshipsWithAI(content: string, source: any, apiKey: string): Promise<ScholarshipData[]> {
  try {
    console.log(`🤖 Using DeepSeek to parse scholarships from ${source.name}...`);
    
    // Truncate content if too long (max 15000 chars for efficiency)
    const truncatedContent = content.substring(0, 15000);
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a scholarship information extractor. Extract ALL scholarships from the provided content and return them as a JSON array. Each scholarship must have:
- title (string, required)
- description (string, required, at least 50 characters)
- deadline (string, format: YYYY-MM-DD if possible, null if not found)
- amount (number, the monetary value, null if not found)
- currency (string: USD, EUR, GBP, etc., default to USD if not specified)
- application_link (string, the URL to apply, null if not found)
- field_of_study (string, the academic field, null if not found)
- education_level (string: one of 'bachelor', 'master', 'phd', 'postdoc', null if not found)
- scholarship_type (string: one of 'full', 'partial', 'tuition_fee', null if not found)
- language (string: 'en', 'fr', 'de', etc., default to 'en')

Return ONLY the JSON array, no other text.`
          },
          {
            role: 'user',
            content: `Extract scholarships from this content:\n\n${truncatedContent}`
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      console.error(`❌ DeepSeek API error: ${response.status}`);
      throw new Error(`DeepSeek API failed: ${response.status}`);
    }

    const data = await response.json();
    const responseContent = data.choices?.[0]?.message?.content;
    
    if (!responseContent) {
      console.log('⚠️ No response from DeepSeek');
      return [];
    }

    // Parse JSON response
    const jsonMatch = responseContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('⚠️ No JSON found in DeepSeek response');
      return [];
    }

    const scholarships = JSON.parse(jsonMatch[0]) as ScholarshipData[];
    
    // Add source country to each scholarship
    scholarships.forEach(scholarship => {
      scholarship.country = scholarship.country || source.country;
    });

    console.log(`✅ Extracted ${scholarships.length} scholarships using AI`);
    return scholarships;

  } catch (error) {
    console.error('❌ Error parsing with AI:', error);
    // Fallback: create a generic entry
    return [{
      title: `${source.name} Scholarships`,
      description: `Please review scholarships at ${source.url}. Automatic extraction failed.`,
      country: source.country,
      application_link: source.url
    }];
  }
}
