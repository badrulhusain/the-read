import type { AppProps } from 'next/app';
import '@/index.css';
import '@/App.css';

export default function TheReadApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
