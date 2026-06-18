type MailArgs = { from: string; to: string; subject: string; html: string };

  // Parse `Name <email@host>` or `email@host` into Brevo's sender shape.
  function parseSender(from: string): { email: string; name?: string } {
    const match = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
    if (match) {
      const name = match[1].replace(/^"|"$/g, '').trim();
      const email = match[2].trim();
      return name ? { email, name } : { email };
    }
    return { email: from.trim() };
  }

  export function createBrevoTransport() {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) return null;

    return {
      async sendMail({ from, to, subject, html }: MailArgs): Promise<void> {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': apiKey,
            'content-type': 'application/json',
            accept: 'application/json',
          },
          body: JSON.stringify({
            sender: parseSender(from),
            to: [{ email: to }],
            subject,
            htmlContent: html,
          }),
        });
        if (!res.ok) {
          const detail = await res.text().catch(() => '');
          throw new Error(`Brevo send failed (${res.status}): ${detail}`);
        }
      },
    };
  }