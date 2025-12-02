import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScholarshipNotificationRequest {
  record: {
    id: string;
    titre: string;
    description: string;
    pays: string;
    domaine_etude: string;
    niveau_etude: string;
    date_limite: string;
    type_bourse: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { record }: ScholarshipNotificationRequest = await req.json();
    
    console.log("New scholarship added:", record.titre);

    // Find matching user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name, target_country, field_of_study, education_level")
      .not("email", "is", null);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      console.log("No user profiles found");
      return new Response(
        JSON.stringify({ message: "No users to notify" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Found ${profiles.length} profiles to check for matches`);

    // Filter profiles that match the scholarship criteria
    const matchingProfiles = profiles.filter((profile) => {
      let matchScore = 0;

      // Match target country
      if (profile.target_country && record.pays) {
        const targetCountry = profile.target_country.toLowerCase();
        const scholarshipCountry = record.pays.toLowerCase();
        if (targetCountry === scholarshipCountry || scholarshipCountry.includes(targetCountry)) {
          matchScore += 3;
        }
      }

      // Match field of study
      if (profile.field_of_study && record.domaine_etude) {
        const fieldOfStudy = profile.field_of_study.toLowerCase();
        const scholarshipField = record.domaine_etude.toLowerCase();
        if (fieldOfStudy === scholarshipField || scholarshipField.includes(fieldOfStudy)) {
          matchScore += 2;
        }
      }

      // Match education level
      if (profile.education_level && record.niveau_etude) {
        const educationLevel = profile.education_level.toLowerCase();
        const scholarshipLevel = record.niveau_etude.toLowerCase();
        if (educationLevel === scholarshipLevel || scholarshipLevel.includes(educationLevel)) {
          matchScore += 2;
        }
      }

      // Consider it a match if score is at least 3
      return matchScore >= 3;
    });

    console.log(`Found ${matchingProfiles.length} matching profiles`);

    if (matchingProfiles.length === 0) {
      return new Response(
        JSON.stringify({ message: "No matching users found" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    let emailsSent = 0;
    const errors: any[] = [];

    // Send email notifications to matching users
    for (const profile of matchingProfiles) {
      try {
        console.log(`Sending notification to ${profile.email}`);

        const { error: emailError } = await supabase.functions.invoke(
          "send-notification-email",
          {
            body: {
              to: profile.email,
              type: "new_scholarship",
              data: {
                userName: profile.full_name || "Student",
                scholarshipName: record.titre,
                deadline: record.date_limite,
                link: `https://soxgicvobtfnzfdybwjx.supabase.co/scholarships`,
                customMessage: record.description?.substring(0, 200) || "",
              },
            },
          }
        );

        if (emailError) {
          console.error(`Failed to send email to ${profile.email}:`, emailError);
          errors.push({ email: profile.email, error: emailError.message });
        } else {
          emailsSent++;
          
          // Create in-app notification
          await supabase.from("notifications").insert({
            user_id: profile.id,
            type: "new_scholarship",
            title: "New Scholarship Available",
            message: `A new scholarship matching your profile is available: ${record.titre}`,
            link: `/scholarships`,
          });
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error: any) {
        console.error(`Error processing notification for ${profile.email}:`, error);
        errors.push({ email: profile.email, error: error.message });
      }
    }

    console.log(`Notification process completed. Emails sent: ${emailsSent}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notified ${emailsSent} users about new scholarship`,
        matchingUsers: matchingProfiles.length,
        emailsSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-new-scholarship function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
