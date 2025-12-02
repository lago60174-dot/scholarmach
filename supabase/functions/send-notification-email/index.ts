import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  to: string;
  type: "new_scholarship" | "deadline_reminder" | "profile_match" | "general";
  data: {
    userName?: string;
    scholarshipName?: string;
    deadline?: string;
    link?: string;
    customMessage?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, type, data }: NotificationEmailRequest = await req.json();

    console.log("Sending notification email:", { to, type });

    if (!to) {
      throw new Error("Recipient email is required");
    }

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // Generate email content based on notification type
    let subject = "";
    let html = "";

    switch (type) {
      case "new_scholarship":
        subject = `🎓 Nouvelle bourse disponible : ${data.scholarshipName || ""}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Nouvelle opportunité de bourse !</h1>
            <p>Bonjour ${data.userName || ""},</p>
            <p>Une nouvelle bourse correspondant à votre profil est disponible :</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #1f2937; margin-top: 0;">${data.scholarshipName || ""}</h2>
              ${data.deadline ? `<p><strong>Date limite :</strong> ${data.deadline}</p>` : ""}
              ${data.customMessage ? `<p>${data.customMessage}</p>` : ""}
            </div>
            ${data.link ? `
              <a href="${data.link}" 
                 style="display: inline-block; background-color: #2563eb; color: white; 
                        padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                        margin: 20px 0;">
                Voir la bourse
              </a>
            ` : ""}
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Vous recevez cet email car vous êtes inscrit sur notre plateforme de bourses d'études.
            </p>
          </div>
        `;
        break;

      case "deadline_reminder":
        subject = `⏰ Rappel : Date limite approche pour ${data.scholarshipName || "votre bourse"}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626;">⏰ Rappel important</h1>
            <p>Bonjour ${data.userName || ""},</p>
            <p>La date limite pour postuler à cette bourse approche :</p>
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
              <h2 style="color: #991b1b; margin-top: 0;">${data.scholarshipName || ""}</h2>
              ${data.deadline ? `<p><strong>Date limite :</strong> ${data.deadline}</p>` : ""}
            </div>
            ${data.link ? `
              <a href="${data.link}" 
                 style="display: inline-block; background-color: #dc2626; color: white; 
                        padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                        margin: 20px 0;">
                Postuler maintenant
              </a>
            ` : ""}
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Ne manquez pas cette opportunité !
            </p>
          </div>
        `;
        break;

      case "profile_match":
        subject = `✨ ${data.customMessage || "Nous avons trouvé des bourses pour vous !"}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">✨ Bourses correspondant à votre profil</h1>
            <p>Bonjour ${data.userName || ""},</p>
            <p>Notre algorithme d'IA a trouvé des bourses qui correspondent parfaitement à votre profil !</p>
            ${data.customMessage ? `
              <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p>${data.customMessage}</p>
              </div>
            ` : ""}
            ${data.link ? `
              <a href="${data.link}" 
                 style="display: inline-block; background-color: #2563eb; color: white; 
                        padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                        margin: 20px 0;">
                Voir les recommandations
              </a>
            ` : ""}
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Consultez régulièrement vos recommandations pour ne manquer aucune opportunité.
            </p>
          </div>
        `;
        break;

      case "general":
      default:
        subject = data.scholarshipName || "Notification";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Notification</h1>
            <p>Bonjour ${data.userName || ""},</p>
            ${data.customMessage ? `<p>${data.customMessage}</p>` : ""}
            ${data.link ? `
              <a href="${data.link}" 
                 style="display: inline-block; background-color: #2563eb; color: white; 
                        padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                        margin: 20px 0;">
                En savoir plus
              </a>
            ` : ""}
          </div>
        `;
        break;
    }

    // Call Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Bourses d'Études <onboarding@resend.dev>",
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
    }

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailData.id,
        message: "Email sent successfully" 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
