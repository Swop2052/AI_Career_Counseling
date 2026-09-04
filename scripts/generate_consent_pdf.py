import os
import sys
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Canvas that computes total pages dynamically and adds header/footer."""
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        self.saveState()
        
        # Top gradient-like bar
        self.setFillColor(colors.HexColor("#00A86B"))
        self.rect(0, 842 - 6, 595.27, 6, stroke=0, fill=1)
        
        # Bottom footer bar
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.8)
        self.line(36, 40, 595.27 - 36, 40)
        
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(36, 26, "SkillSense AI Career Guidance Platform • Policy & Consent Document")
        
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(595.27 - 36, 26, page_text)
        
        self.restoreState()


def create_consent_pdf(output_path: str):
    """Generate a high-polish PDF consent document using ReportLab."""
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    
    # Page setup: A4 with compact margins for a 1-page layout
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=32,
        rightMargin=32,
        topMargin=26,
        bottomMargin=36
    )
    
    # Color Palette matching SkillSense Theme
    C_PRIMARY = colors.HexColor("#00A86B")       # Emerald Green
    C_PRIMARY_DARK = colors.HexColor("#008755")  # Dark Emerald
    C_PRIMARY_BG = colors.HexColor("#F0FDF4")    # Light Emerald Tint
    C_INK = colors.HexColor("#0F172A")           # Deep Slate Black
    C_MUTED = colors.HexColor("#64748B")         # Slate Gray
    C_STROKE = colors.HexColor("#E2E8F0")        # Border Gray
    C_CARD_BG = colors.HexColor("#F8FAFC")       # Soft Card Gray
    C_ACCENT_BG = colors.HexColor("#F1F5F9")     # Highlight Slate
    C_WHITE = colors.HexColor("#FFFFFF")
    
    # Typography Styles
    brand_style = ParagraphStyle(
        'BrandTitle',
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=19,
        textColor=C_INK
    )
    
    tagline_style = ParagraphStyle(
        'BrandTagline',
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=C_MUTED
    )
    
    badge_style = ParagraphStyle(
        'DocBadge',
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        alignment=TA_RIGHT,
        textColor=C_PRIMARY_DARK
    )
    
    doc_title_style = ParagraphStyle(
        'DocTitle',
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=17,
        textColor=C_INK,
        spaceAfter=2
    )
    
    doc_subtitle_style = ParagraphStyle(
        'DocSubtitle',
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=C_MUTED,
        spaceAfter=8
    )
    
    section_heading_style = ParagraphStyle(
        'SectionHeading',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=C_INK,
        spaceBefore=0,
        spaceAfter=2
    )
    
    bullet_style = ParagraphStyle(
        'BulletText',
        fontName='Helvetica',
        fontSize=8,
        leading=10.8,
        textColor=colors.HexColor("#334155")
    )
    
    table_hdr_style = ParagraphStyle(
        'TableHdr',
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=C_INK
    )
    
    table_body_style = ParagraphStyle(
        'TableBody',
        fontName='Helvetica',
        fontSize=7.8,
        leading=10.2,
        textColor=colors.HexColor("#334155")
    )

    story = []
    
    # -------------------------------------------------------------
    # 1. HEADER SECTION (Brand & Document Meta)
    # -------------------------------------------------------------
    logo_path = r"E:\projects\AI_Career_Counseling\static\logo.png"
    
    left_header = []
    if os.path.exists(logo_path):
        logo_img = Image(logo_path, width=26, height=26)
        logo_table = Table([[logo_img, Paragraph("<b>SkillSense</b><br/><font size=7.5 color='#64748B'>AI Career Counseling</font>", brand_style)]], colWidths=[32, 270])
        logo_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))
        left_header.append(logo_table)
    else:
        left_header.append(Paragraph("<b>SkillSense</b>", brand_style))
        left_header.append(Paragraph("AI-Powered Career Guidance", tagline_style))
        
    right_meta = [
        Paragraph("<font color='#00A86B'><b>OFFICIAL POLICY & CONSENT</b></font>", badge_style),
        Paragraph("<font size=7 color='#64748B'>SkillSense Platform • Version 2.1</font>", badge_style),
        Paragraph("<font size=7 color='#64748B'>Applies to: All Registered Students</font>", badge_style),
    ]
    
    header_table = Table([[left_header, right_meta]], colWidths=[330, 201])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.2, color=C_PRIMARY, spaceBefore=1, spaceAfter=8))
    
    # -------------------------------------------------------------
    # 2. DOCUMENT TITLE & SUMMARY
    # -------------------------------------------------------------
    story.append(Paragraph("Payment, Refund & Assessment Credit Policy", doc_title_style))
    story.append(Paragraph(
        "Please review this concise summary of payment processing, our strict no-refund policy, and how assessment credits work before proceeding with any credit purchase or roadmap unlock.",
        doc_subtitle_style
    ))
    
    # -------------------------------------------------------------
    # 3. SECTION 1 & SECTION 2: PAYMENT GATEWAY & REFUND POLICY (Side by Side Cards)
    # -------------------------------------------------------------
    sec1_content = [
        Paragraph("<font color='#00A86B'><b>1. Payment Gateway & Security</b></font>", section_heading_style),
        Spacer(1, 2),
        Paragraph("• <b>Payment Gateway:</b> We use <b>Razorpay</b> as our official payment processor.", bullet_style),
        Spacer(1, 2),
        Paragraph("• <b>Payment Methods:</b> UPI, Credit/Debit Cards, Net Banking, and Wallets are processed securely.", bullet_style),
        Spacer(1, 2),
        Paragraph("• <b>Credential Safety:</b> All payment API credentials and secrets are managed securely through server-side environment configuration. SkillSense never stores your banking credentials or card CVVs.", bullet_style),
    ]
    
    sec2_content = [
        Paragraph("<font color='#0F172A'><b>2. Strict No-Refund Policy</b></font>", section_heading_style),
        Spacer(1, 2),
        Paragraph("• <b>Final Purchases:</b> All credit purchases and payments operate under a <b>strict no-refund policy</b>.", bullet_style),
        Spacer(1, 2),
        Paragraph("• <b>Instant Digital Delivery:</b> Because assessment credits are digital goods credited immediately upon payment confirmation, purchases cannot be refunded, cancelled, or exchanged for cash.", bullet_style),
        Spacer(1, 2),
        Paragraph("• <b>Billing Support:</b> In case of deduction issues, platform support will verify the Razorpay ID and ensure credits are added to your wallet.", bullet_style),
    ]
    
    card_table = Table([[sec1_content, sec2_content]], colWidths=[260, 260])
    card_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), C_PRIMARY_BG),
        ('BACKGROUND', (1, 0), (1, 0), C_CARD_BG),
        ('BOX', (0, 0), (0, 0), 1, C_PRIMARY),
        ('BOX', (1, 0), (1, 0), 1, C_STROKE),
        ('ROUNDEDCORNERS', [6, 6, 6, 6]),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(card_table)
    story.append(Spacer(1, 8))
    
    # -------------------------------------------------------------
    # 4. SECTION 3: HOW THE CREDIT SYSTEM WORKS (Table Grid)
    # -------------------------------------------------------------
    credit_points = [
        [
            Paragraph("<b>Assessment & Teaser</b>", table_hdr_style),
            Paragraph("Taking the 42-question RIASEC career assessment is completely <b>FREE</b>. Completing an assessment or viewing the initial top match teaser does <b>not</b> consume any credit.", table_body_style)
        ],
        [
            Paragraph("<b>1 Credit = 1 Roadmap</b>", ParagraphStyle('H2', fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=C_PRIMARY_DARK)),
            Paragraph("<b>1 Assessment Credit = 1 complete Career Roadmap unlock</b> for one specific assessment attempt. Spending 1 credit permanently unlocks the full personalized career analysis.", table_body_style)
        ],
        [
            Paragraph("<b>Permanent Access</b>", table_hdr_style),
            Paragraph("Once unlocked, that result can be viewed anytime from the student's account without spending another credit. You maintain permanent lifetime access to your unlocked roadmaps.", table_body_style)
        ],
        [
            Paragraph("<b>Independent Attempts</b>", table_hdr_style),
            Paragraph("Each assessment is independent. Unlocking one specific attempt does <b>not</b> unlock another assessment attempt.", table_body_style)
        ],
        [
            Paragraph("<b>Pricing & Discounts</b>", table_hdr_style),
            Paragraph("Credits are purchased through the available pricing plans. Referral and campaign discounts can reduce the payment amount at checkout, but do not change the standard 1 credit = 1 roadmap rule unless explicitly configured as a free credit grant.", table_body_style)
        ],
    ]
    
    credit_table = Table(credit_points, colWidths=[130, 390])
    credit_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEBELOW', (0, 0), (-1, -2), 0.5, C_STROKE),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#F8FAFC")),
        ('BACKGROUND', (1, 0), (1, -1), C_WHITE),
        ('BOX', (0, 0), (-1, -1), 0.8, C_STROKE),
    ]))
    
    credit_box_heading = Paragraph("<font color='#00A86B'><b>3. Platform Credit System & Assessment Flow</b></font>", section_heading_style)
    story.append(credit_box_heading)
    story.append(Spacer(1, 3))
    story.append(credit_table)
    story.append(Spacer(1, 8))
    
    # -------------------------------------------------------------
    # 5. SECTION 4: STUDENT CONSENT & ACKNOWLEDGEMENT
    # -------------------------------------------------------------
    consent_box_content = [
        [
            Paragraph("<font color='#34D399' size=9.5><b>STUDENT CONSENT & ACKNOWLEDGEMENT</b></font>", ParagraphStyle('HConsent', fontName='Helvetica-Bold', alignment=TA_CENTER)),
        ],
        [
            Spacer(1, 2),
        ],
        [
            Paragraph(
                "“I understand and agree to the payment gateway, no-refund policy, and credit usage described above.”",
                ParagraphStyle('ConsentQuote', fontName='Helvetica-Bold', fontSize=9.5, leading=13, alignment=TA_CENTER, textColor=C_WHITE)
            ),
        ],
        [
            Spacer(1, 2),
        ],
        [
            Paragraph(
                "By clicking <b>Pay</b>, <b>Buy Credits</b>, or <b>Redeem</b> on SkillSense, you confirm that you have read, understood, and agreed to this consent policy in its entirety before proceeding with a payment.",
                ParagraphStyle('ConsentSub', fontName='Helvetica', fontSize=7.5, leading=10, alignment=TA_CENTER, textColor=colors.HexColor("#94A3B8"))
            ),
        ]
    ]
    
    consent_table = Table(consent_box_content, colWidths=[520])
    consent_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#0F172A")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('ROUNDEDCORNERS', [8, 8, 8, 8]),
    ]))
    
    story.append(KeepTogether([consent_table]))
    
    # Build Document with NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[SUCCESS] PDF Generated at: {output_path}")

if __name__ == "__main__":
    out_file = sys.argv[1] if len(sys.argv) > 1 else r"E:\projects\AI_Career_Counseling\static\docs\SkillSense_Payment_and_Credit_Policy_Consent.pdf"
    create_consent_pdf(out_file)
