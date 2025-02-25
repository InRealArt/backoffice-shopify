'use client';

import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";


export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {

  

  return (
    <DynamicContextProvider
      theme="auto"
      settings={{
        environmentId: "2762a57b-faa4-41ce-9f16-abff9300e2c9",
           walletConnectors: [],
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}