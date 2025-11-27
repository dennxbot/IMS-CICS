import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const EmailVerificationClient = dynamic(() => import('./EmailVerificationClient'), {
  ssr: false,
  loading: () => <p>Loading verification…</p>,
});

export const metadata: Metadata = {
  title: 'Email Verification',
  description: 'Verify your email address',
};

export default async function VerifyEmail() {
  return <EmailVerificationClient />;
}