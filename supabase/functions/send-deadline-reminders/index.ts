import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting deadline reminders check...");

    // Calculate date 7 days from now
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const targetDate = sevenDaysFromNow.toISOString().split('T')[0];

    console.log("Looking for scholarships with deadline on:", targetDate);

    // Get scholarships with deadline in 7 days
    const { data: scholarships, error: scholarshipsError } = await supabase
      .from('bourse')
      .select('*')
      .eq('est_active', true)
      .eq('date_limite', targetDate);

    if (scholarshipsError) {
      console.error("Error fetching scholarships:", scholarshipsError);
      throw scholarshipsError;
    }

    if (!scholarships || scholarships.length === 0) {
      console.log("No scholarships with deadline in 7 days");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No scholarships with upcoming deadline",
          count: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${scholarships.length} scholarships with deadline in 7 days`);

    let emailsSent = 0;
    let errors = 0;

    // For each scholarship, find users who might be interested
    for (const scholarship of scholarships) {
      console.log(`Processing scholarship: ${scholarship.titre}`);

      // Get users who have this scholarship in their recommendations
      const { data: recommendations, error: recsError } = await supabase
        .from('recommendations')
        .select('user_id, profiles!inner(email, full_name)')
        .eq('bourse_id', scholarship.id);

      if (recsError) {
        console.error("Error fetching recommendations:", recsError);
        errors++;
        continue;
      }

      if (!recommendations || recommendations.length === 0) {
        console.log(`No users found for scholarship: ${scholarship.titre}`);
        continue;
      }

      console.log(`Sending reminders to ${recommendations.length} users for ${scholarship.titre}`);

      // Send email to each user
      for (const rec of recommendations) {
        try {
          const profile = rec.profiles as any;
          
          if (!profile || !profile.email) {
            console.log("Skipping user with no email");
            continue;
          }

          // Call send-notification-email function
          const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              to: profile.email,
              type: "deadline_reminder",
              data: {
                userName: profile.full_name || "Étudiant",
                scholarshipName: scholarship.titre,
                deadline: new Date(scholarship.date_limite).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }),
                link: `${supabaseUrl.replace('supabase.co', 'lovableproject.com')}/scholarships`,
              }
            })
          });

          if (emailResponse.ok) {
            emailsSent++;
            console.log(`Email sent to ${profile.email}`);
          } else {
            const errorData = await emailResponse.text();
            console.error(`Failed to send email to ${profile.email}:`, errorData);
            errors++;
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (emailError) {
          console.error("Error sending email:", emailError);
          errors++;
        }
      }
    }

    console.log(`Deadline reminders completed. Sent: ${emailsSent}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        scholarshipsProcessed: scholarships.length,
        emailsSent,
        errors,
        message: `Sent ${emailsSent} deadline reminders`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-deadline-reminders:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
