package email

import (
	"fmt"
	"log"

	"github.com/resendlabs/resend-go"
)

type EmailService struct {
	client    *resend.Client
	fromEmail string
	enabled   bool
}

func NewEmailService(apiKey, fromEmail string) *EmailService {
	if apiKey == "" {
		log.Println("Email service: Resend API key not configured, emails will be disabled")
		return &EmailService{
			enabled:   false,
			fromEmail: fromEmail,
		}
	}

	client := resend.NewClient(apiKey)
	return &EmailService{
		client:    client,
		fromEmail: fromEmail,
		enabled:   true,
	}
}

func (s *EmailService) SendVerificationCode(email, code string) error {
	if !s.enabled {
		log.Printf("EMAIL (mock) to %s: Your verification code is: %s (valid for 2 minutes)", email, code)
		return nil
	}

	htmlContent := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #010A13; color: #F0E6D2; padding: 40px; }
        .container { max-width: 400px; margin: 0 auto; background: #091220; padding: 30px; border-radius: 8px; border: 1px solid #1E2328; }
        .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #C8AA6E; text-align: center; padding: 20px; background: #010A13; border-radius: 4px; }
        .footer { margin-top: 20px; font-size: 12px; color: #786E4D; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h2 style="color: #C8AA6E; text-align: center; margin-bottom: 20px;">LPP Login Verification</h2>
        <p style="color: #A8B4BE; text-align: center; margin-bottom: 20px;">Enter this code to complete your login:</p>
        <div class="code">%s</div>
        <p style="color: #A8B4BE; text-align: center; margin-top: 20px;">This code expires in 2 minutes.</p>
        <div class="footer">
            <p>If you didn't request this, please ignore this email.</p>
            <p>League Press Poll</p>
        </div>
    </div>
</body>
</html>
`, code)

	params := &resend.SendEmailRequest{
		From:    s.fromEmail,
		To:      []string{email},
		Subject: "Your LPP Login Verification Code",
		Html:    htmlContent,
	}

	_, err := s.client.Emails.Send(params)
	if err != nil {
		log.Printf("Failed to send email to %s: %v", email, err)
		return err
	}

	log.Printf("Email sent to %s", email)
	return nil
}
