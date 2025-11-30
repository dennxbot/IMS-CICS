"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PolicyModalProps {
    trigger: React.ReactNode
    type: "privacy" | "terms"
}

export function PolicyModal({ trigger, type }: PolicyModalProps) {
    const isPrivacy = type === "privacy"

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="w-[90vw] max-w-3xl max-h-[85vh] sm:max-h-[80vh] p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="text-lg sm:text-2xl font-bold">
                        {isPrivacy ? "Privacy Policy" : "Terms of Service"}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                        Last updated: November 30, 2025
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[65vh] sm:h-[60vh] pr-2 sm:pr-4">
                    {isPrivacy ? <PrivacyPolicyContent /> : <TermsOfServiceContent />}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

function PrivacyPolicyContent() {
    return (
        <div className="space-y-4 sm:space-y-6 text-xs sm:text-sm">
            <section>
                <h3 className="font-semibold text-base sm:text-lg mb-2">1. Introduction</h3>
                <p className="text-muted-foreground leading-relaxed">
                    Welcome to the Cagayan State University Internship Management System (&quot;IMS-CICS&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;).
                    We are committed to protecting your personal information and your right to privacy. This Privacy Policy
                    explains how we collect, use, disclose, and safeguard your information when you use our internship
                    management platform.
                </p>
            </section>

            <section>
                <h3 className="font-semibold text-lg mb-2">2. Information We Collect</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">
                    We collect information that you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Personal identification information (name, email address, student ID)</li>
                    <li>Academic information (course, year level, department)</li>
                    <li>Internship details (company information, hours logged, reports)</li>
                    <li>Account credentials (username, encrypted password)</li>
                    <li>Profile information and uploaded documents</li>
                    <li>Communication data (messages, notifications)</li>
                </ul>
            </section>

            <section>
                <h3 className="font-semibold text-lg mb-2">3. How We Use Your Information</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">
                    We use the information we collect to:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Manage and facilitate your internship program</li>
                    <li>Track internship hours and generate reports</li>
                    <li>Communicate with you about your internship progress</li>
                    <li>Coordinate between students, coordinators, and companies</li>
                    <li>Ensure compliance with internship requirements</li>
                    <li>Improve our services and user experience</li>
                    <li>Send administrative information and notifications</li>
                </ul>
            </section>

            <section>
                <h3 className="font-semibold text-lg mb-2">4. Information Sharing</h3>
                <p className="text-muted-foreground leading-relaxed">
                    We may share your information with:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li><strong>Academic Coordinators:</strong> To monitor and evaluate your internship progress</li>
                    <li><strong>Host Companies:</strong> To facilitate your internship placement and supervision</li>
                    <li><strong>University Administration:</strong> For academic records and compliance purposes</li>
                    <li><strong>Service Providers:</strong> Who assist in operating our platform (with strict confidentiality agreements)</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-2">
                    We do not sell, trade, or rent your personal information to third parties.
                </p>
            </section>

            <section>
                <h3 className="font-semibold text-lg mb-2">5. Data Security</h3>
                <p className="text-muted-foreground leading-relaxed">
                    We implement appropriate technical and organizational security measures to protect your personal information,
                    including encryption, secure servers, and access controls. However, no method of transmission over the internet
                    is 100% secure, and we cannot guarantee absolute security.
                </p>
            </section>

            <section>
                <h3 className="font-semibold text-lg mb-2">6. Data Retention</h3>
                <p className="text-muted-foreground leading-relaxed">
                    We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy
                    Policy, comply with legal obligations, resolve disputes, and enforce our agreements. Academic records may be
                    retained according to university policies and legal requirements.
                </p>
            </section>

            <section>
                <h3 className="font-semibold text-lg mb-2">7. Your Rights</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">
                    You have the right to:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Access and review your personal information</li>
                    <li>Request corrections to inaccurate information</li>
                    <li>Request deletion of your information (subject to legal and academic requirements)</li>
                    <li>Opt-out of non-essential communications</li>
                    <li>Lodge a complaint with relevant data protection authorities</li>
                </ul>
            </section>

            <section>
                <h3 className="font-semibold text-lg mb-2">8. Cookies and Tracking</h3>
                <p className="text-muted-foreground leading-relaxed">
                    We use cookies and similar tracking technologies to maintain your session, remember your preferences,
                    and analyze platform usage. You can control cookie settings through your browser preferences.
                </p>
            </section>

            <section>
                <h3 className="font-semibold text-lg mb-2">9. Changes to This Policy</h3>
                <p className="text-muted-foreground leading-relaxed">
                    We may update this Privacy Policy from time to time. We will notify you of any changes by posting the
                    new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
                </p>
            </section>

            <section>
                <h3 className="font-semibold text-lg mb-2">10. Contact Us</h3>
                <p className="text-muted-foreground leading-relaxed">
                    If you have questions or concerns about this Privacy Policy, please contact:
                </p>
                <div className="mt-2 text-muted-foreground">
                    <p>Cagayan State University</p>
                    <p>College of Information and Computing Sciences</p>
                    <p>Email: cics@csu.edu.ph</p>
                </div>
            </section>
        </div>
    )
}

function TermsOfServiceContent() {
    return (
        <div className="space-y-4 sm:space-y-6 text-xs sm:text-sm">
            <section>
                <h3 className="font-semibold text-base sm:text-lg mb-2">1. Acceptance of Terms</h3>
                <p className="text-muted-foreground leading-relaxed">
                    By accessing and using the Cagayan State University Internship Management System (&quot;IMS-CICS&quot;), you accept
                    and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use
                    the platform.
                </p>
            </section>

            <section>
                <h3 className="font-semibold text-lg mb-2">2. Eligibility</h3>
                <p className="text-muted-foreground leading-relaxed">
                    This platform is intended for use by:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Currently enrolled students of Cagayan State University</li>
                    <li>Authorized academic coordinators and faculty members</li>
                    <li>Approved internship host companies and supervisors</li>
                    <li>University administrators with proper authorization</li>
                </ul>
            </section>

            <section>
                <h3 className="font-semibold text-lg mb-2">3. User Accounts</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">
                    You are responsible for:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Maintaining the confidentiality of your account credentials</li>
                    <li>All activities that occur under your account</li>
                    <li>Notifying us immediately of any unauthorized access</li>
                    <li>Providing accurate and current information</li>
                    <li>Not sharing your account with others</li>
                </ul>
            </section>

            <section>
                <h3 className="font-semibold text-lg mb-2">4. Acceptable Use</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">
                    You agree NOT to:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Submit false or misleading information</li>
                    <li>Falsify internship hours or reports</li>
                    <li>Access or attempt to access another user&apos;s account</li>
                    <li>Interfere with the platform&apos;s operation or security</li>
                    <li>Use the platform for any unlawful purpose</li>
                    <li>Upload malicious code or harmful content</li>
                    <li>Harass, abuse, or harm other users</li>
                    <li>Violate any applicable laws or regulations</li>
                </ul>
            </section>

            <section>
                <h3 className="font-semibold text-lg mb-2">5. Internship Requirements</h3>
                <p className="text-muted-foreground leading-relaxed">
                    Students must:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Accurately log all internship hours in real-time</li>
                    <li>Submit timely and truthful progress reports</li>
                    <li>Comply with host company policies and requirements</li>
                    <li>Maintain professional conduct throughout the internship</li>
                    <li>Complete the required number of internship hours</li>
                    <li>Respond to coordinator communications promptly</li>
                </ul>
            </section>

            <section>
                <h3 className="font-semibold text-lg mb-2">6. Content Ownership</h3>
                <p className="text-muted-foreground leading-relaxed">
                    You retain ownership of content you submit (reports, documents, etc.). By submitting content, you grant
                    CSU a non-exclusive license to use, store, and display such content for academic and administrative purposes.
                    The platform and its original content, features, and functionality are owned by Cagayan State University.
                </p>
            </section>

            <section>
                <h3 className="font-semibold text-lg mb-2">7. Academic Integrity</h3>
                <p className="text-muted-foreground leading-relaxed">
                    All users must adhere to CSU&apos;s academic integrity policies. Violations including plagiarism, falsification
                    of records, or dishonest reporting may result in disciplinary action, including but not limited to account
                    suspension, academic penalties, or dismissal from the internship program.
                </p>
            </section>

            <section>
                <h3 className="font-semibold text-lg mb-2">8. Disclaimer of Warranties</h3>
                <p className="text-muted-foreground leading-relaxed">
                    The platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied.
                    We do not guarantee that the platform will be uninterrupted, secure, or error-free. We are not responsible
                    for the conduct of internship host companies or the quality of internship experiences.
                </p>
            </section>

            <section>
                <h3 className="font-semibold text-lg mb-2">9. Limitation of Liability</h3>
                <p className="text-muted-foreground leading-relaxed">
                    To the maximum extent permitted by law, CSU and IMS-CICS shall not be liable for any indirect, incidental,
                    special, consequential, or punitive damages resulting from your use or inability to use the platform,
                    including but not limited to data loss, missed deadlines, or internship placement issues.
                </p>
            </section>

            <section>
                <h3 className="font-semibold text-lg mb-2">10. Termination</h3>
                <p className="text-muted-foreground leading-relaxed">
                    We reserve the right to suspend or terminate your access to the platform at any time, without prior notice,
                    for conduct that we believe violates these Terms of Service, is harmful to other users, or is otherwise
                    inappropriate. Upon termination, your right to use the platform will immediately cease.
                </p>
            </section>

            <section>
                <h3 className="font-semibold text-lg mb-2">11. Changes to Terms</h3>
                <p className="text-muted-foreground leading-relaxed">
                    We reserve the right to modify these Terms of Service at any time. We will notify users of any material
                    changes. Your continued use of the platform after such modifications constitutes acceptance of the updated terms.
                </p>
            </section>

            <section>
                <h3 className="font-semibold text-lg mb-2">12. Governing Law</h3>
                <p className="text-muted-foreground leading-relaxed">
                    These Terms of Service shall be governed by and construed in accordance with the laws of the Republic of
                    the Philippines, without regard to its conflict of law provisions.
                </p>
            </section>

            <section>
                <h3 className="font-semibold text-lg mb-2">13. Contact Information</h3>
                <p className="text-muted-foreground leading-relaxed">
                    For questions about these Terms of Service, please contact:
                </p>
                <div className="mt-2 text-muted-foreground">
                    <p>Cagayan State University</p>
                    <p>College of Information and Computing Sciences</p>
                    <p>Email: cics@csu.edu.ph</p>
                </div>
            </section>
        </div>
    )
}
