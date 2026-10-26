import dynamic from 'next/dynamic';
import Head from 'next/head';

// The existing router uses browser storage and the current URL.
// Keep it client-rendered while Next serves the static shell and API together.
const App = dynamic(() => import('@/App'), { ssr: false });

export default function Home() {
  return (
    <>
      <Head><title>The Read</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <App />
    </>
  );
}
