import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ------------------- ML PREDICTIONS (HEURISTIC FALLBACK) -------------------
function predictWithModel(profile: any, scholarships: any[]): number[] {
  const scores: number[] = [];
  
  for (const s of scholarships) {
    let score = 0.0;
    
    // Pays d'origine match
    if (profile.pays_origine && (s.pays || '').toLowerCase().includes(profile.pays_origine.toLowerCase())) {
      score += 0.1;
    }
    
    // Pays cible match
    if (profile.pays_cible && (s.pays || '').toLowerCase().includes(profile.pays_cible.toLowerCase())) {
      score += 0.1;
    }
    
    // Domaine d'étude match
    if (profile.domaine_etude && (s.domaine_etude || '').toLowerCase().includes(profile.domaine_etude.toLowerCase())) {
      score += 0.2;
    }
    
    // Niveau d'étude match
    if (profile.niveau_etude && (s.niveau_etude || '').toLowerCase().includes(profile.niveau_etude.toLowerCase())) {
      score += 0.15;
    }
    
    // Mention scolaire / GPA
    try {
      const mention = parseFloat(profile.mention_scolaire || 0);
      const minMentions = parseFloat(s.mentions_min || 0);
      if (mention >= minMentions) {
        score += 0.1;
      } else {
        score -= 0.05;
      }
    } catch (e) {
      // ignore
    }
    
    // Type de bourse
    if (profile.type_bourse && (s.type_bourse || '').toLowerCase().includes(profile.type_bourse.toLowerCase())) {
      score += 0.1;
    }
    
    // Type de financement
    if (profile.type_financement && (s.type_financement || '').toLowerCase().includes(profile.type_financement.toLowerCase())) {
      score += 0.1;
    }
    
    // Montant boost
    try {
      const amt = parseFloat(s.montant || 0);
      score += Math.min(amt / 10000.0, 0.05);
    } catch (e) {
      // ignore
    }
    
    // Âge check
    try {
      const age = parseInt(profile.age || 0);
      const ageMin = parseInt(s.age_min || 0);
      const ageMax = parseInt(s.age_max || 100);
      if (age < ageMin || age > ageMax) {
        score -= 0.1;
      }
    } catch (e) {
      // ignore
    }
    
    scores.push(score);
  }
  
  // Normalize scores
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  if (maxScore - minScore > 0) {
    return scores.map(s => (s - minScore) / (maxScore - minScore));
  }
  return scores;
}

// ------------------- RÈGLES MÉTIER -------------------
function applyRuleBasedFilters(profile: any, scholarships: any[]): number[] {
  const results: number[] = [];
  
  for (const s of scholarships) {
    let score = 0.0;
    
    // Pays cible boost
    if (profile.pays_cible && (s.pays || '').toLowerCase().includes(profile.pays_cible.toLowerCase())) {
      score += 0.1;
    }
    
    // Domaine d'étude boost
    if (profile.domaine_etude && (s.domaine_etude || '').toLowerCase().includes(profile.domaine_etude.toLowerCase())) {
      score += 0.1;
    }
    
    // Type financement boost
    if (profile.type_financement && (s.type_financement || '').toLowerCase().includes(profile.type_financement.toLowerCase())) {
      score += 0.1;
    }
    
    // Mention minimum penalty
    try {
      const mention = parseFloat(profile.mention_scolaire || 0);
      const minMentions = parseFloat(s.mentions_min || 0);
      if (mention < minMentions) {
        score -= 0.1;
      }
    } catch (e) {
      // ignore
    }
    
    // Âge penalty
    try {
      const age = parseInt(profile.age || 0);
      const ageMin = parseInt(s.age_min || 0);
      const ageMax = parseInt(s.age_max || 100);
      if (age < ageMin || age > ageMax) {
        score -= 0.1;
      }
    } catch (e) {
      // ignore
    }
    
    results.push(score);
  }
  
  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('Fetching profile for user:', user.id);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found. Please complete your profile first.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Profile found:', profile);

    // Fetch all scholarships
    const { data: scholarships, error: scholarshipsError } = await supabase
      .from('bourse')
      .select('*')
      .eq('est_active', true)
      .eq('est_validee', true);

    if (scholarshipsError) {
      console.error('Scholarships error:', scholarshipsError);
      throw new Error('Failed to fetch scholarships');
    }

    console.log(`Found ${scholarships?.length || 0} scholarships`);

    if (!scholarships || scholarships.length === 0) {
      return new Response(
        JSON.stringify({ 
          recommendations: [],
          count: 0,
          message: 'No scholarships available'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map education level to niveau_etude
    const educationLevelMap: { [key: string]: string[] } = {
      'high_school': ['LICENCE'],
      'undergraduate': ['LICENCE'],
      'masters': ['MASTER'],
      'phd': ['DOCTORAT'],
      'postdoc': ['POSTDOC']
    };

    // Prepare profile data for algorithm
    const profileData = {
      age: profile.age,
      pays_origine: profile.origin_country,
      pays_cible: profile.target_country,
      domaine_etude: profile.field_of_study,
      niveau_etude: profile.education_level,
      mention_scolaire: profile.gpa,
      type_bourse: profile.scholarship_type,
      type_financement: profile.finance_type || 'complète',
      preferred_language: profile.preferred_language || 'en',
    };

    // Map language codes to full names for matching
    const languageMap: { [key: string]: string[] } = {
      'en': ['EN', 'ENGLISH', 'ANGLAIS'],
      'fr': ['FR', 'FRENCH', 'FRANCAIS', 'FRANÇAIS'],
      'es': ['ES', 'SPANISH', 'ESPAGNOL'],
      'de': ['DE', 'GERMAN', 'ALLEMAND'],
      'other': []
    };

    // Country synonyms map for better matching
    const countrySynonyms: { [key: string]: string[] } = {
      'usa': ['usa', 'united states', 'états-unis', 'us', 'america', 'etats-unis'],
      'uk': ['uk', 'united kingdom', 'royaume-uni', 'grande-bretagne', 'england', 'britain'],
      'canada': ['canada'],
      'germany': ['germany', 'allemagne', 'deutschland'],
      'france': ['france'],
      'spain': ['spain', 'espagne', 'españa'],
    };

    const acceptedLevels = educationLevelMap[profile.education_level] || [];
    const acceptedLanguages = languageMap[profile.preferred_language || 'en'] || [];
    
    // Get country synonyms for the user's target country
    const targetCountryLower = (profile.target_country || '').toLowerCase();
    const targetCountrySynonyms = countrySynonyms[targetCountryLower] || [targetCountryLower];

    // FLEXIBLE FILTER: Scholarships matching level, country with synonyms, and language
    const filteredScholarships = scholarships.filter(s => {
      // Must match education level
      const levelMatch = acceptedLevels.includes(s.niveau_etude || '');
      if (!levelMatch) return false;

      // Match target country using synonyms (more flexible)
      const scholarshipCountry = (s.pays || '').toLowerCase();
      const countryMatch = !profile.target_country || 
        targetCountrySynonyms.some(syn => scholarshipCountry.includes(syn)) ||
        (s.pays_cibles || []).some((pc: string) => 
          targetCountrySynonyms.some(syn => pc.toLowerCase().includes(syn))
        );
      if (!countryMatch) return false;

      // Language is more flexible - match if scholarship has no language specified or if it matches
      const languageMatch = !s.langue || 
        s.langue.trim() === '' ||
        acceptedLanguages.some(lang => (s.langue || '').toUpperCase().includes(lang));
      if (!languageMatch) return false;

      return true;
    });

    console.log(`Filtered to ${filteredScholarships.length} scholarships matching criteria`);

    if (filteredScholarships.length === 0) {
      return new Response(
        JSON.stringify({ 
          recommendations: [],
          count: 0,
          message: 'No scholarships match your profile criteria. Try adjusting your preferences.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If only a few filtered scholarships, return all with varied scores
    if (filteredScholarships.length <= 3) {
      console.log('Limited scholarships available, returning all with basic scoring');
      const basicRecommendations = filteredScholarships.map((s, index) => ({
        ...s,
        score: 1 - (index * 0.1)
      }));
      
      return new Response(
        JSON.stringify({ 
          recommendations: basicRecommendations,
          count: basicRecommendations.length,
          profile: profileData,
          message: 'Limited scholarships available. Add more for better AI matching.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Running recommendation algorithm on filtered scholarships...');

    // Run ML prediction (heuristic fallback) on filtered scholarships
    const mlScores = predictWithModel(profileData, filteredScholarships);
    
    // Run rule-based filters on filtered scholarships
    const ruleScores = applyRuleBasedFilters(profileData, filteredScholarships);

    // Combine scores: 70% ML + 30% rules
    const combined = filteredScholarships.map((s, i) => ({
      scholarship: s,
      score: (0.7 * mlScores[i]) + (0.3 * ruleScores[i])
    }));

    // Sort by score descending
    combined.sort((a, b) => b.score - a.score);

    // Get top 10
    const limit = 10;
    const topRecommendations = combined.slice(0, limit);

    console.log(`Returning ${topRecommendations.length} recommendations`);

    // Return recommendations with full scholarship details and scores
    const recommendations = topRecommendations.map(r => ({
      ...r.scholarship,
      score: Math.round(r.score * 100) / 100
    }));

    return new Response(
      JSON.stringify({ 
        recommendations,
        count: recommendations.length,
        profile: profileData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

