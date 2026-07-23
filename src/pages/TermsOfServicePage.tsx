import { SeoPageLayout } from "@/components/seo";

const TermsOfServicePage = () => {
  return (
    <SeoPageLayout title="Terms of Service" description="Effective Date: 28 March, 2026 · Last Updated: 30 March, 2026">
      <h2>1. Acceptance of Terms</h2>
      <p>
        These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") and OmenX ("we," "us," or "our"). By accessing or using the OmenX platform at{" "}
        <a href="https://omenx.com" target="_blank" rel="noopener noreferrer">https://omenx.com</a>, including any associated applications, features, and services (collectively, the "Platform"), you agree to be bound by these Terms.
      </p>
      <p>If you do not agree to these Terms, do not access or use the Platform.</p>

      <h2>2. Eligibility</h2>
      <p>By using the Platform, you represent and warrant that:</p>
      <ul>
        <li>You are at least 18 years of age or the age of legal majority in your jurisdiction, whichever is greater.</li>
        <li>You have the legal capacity to enter into a binding agreement.</li>
        <li>You are not located in, or a resident or citizen of, any jurisdiction where the use of prediction markets or leveraged trading is prohibited or restricted by law.</li>
        <li>You are not subject to any sanctions administered by OFAC, the United Nations, the European Union, or any other applicable authority.</li>
        <li>You will comply with all applicable local, state, national, and international laws and regulations.</li>
      </ul>
      <p>We reserve the right to restrict or deny access to the Platform at our sole discretion.</p>

      <h2>3. Platform Description</h2>
      <p>OmenX is a prediction market trading platform that enables users to trade outcome contracts on real-world events. The Platform offers:</p>
      <ul>
        <li><strong>Leveraged Outcome Trading:</strong> Yes and No positions on event outcomes with adjustable leverage (up to 10x). Under the hood, Yes corresponds to a long position and No to a short position on the Yes outcome.</li>
        <li><strong>Order Book Trading:</strong> Limit and market orders through a central limit order book (CLOB).</li>
        <li><strong>Cross-Margin Accounts:</strong> Unified trading accounts with shared margin across positions.</li>
        <li><strong>Settlement in USDC:</strong> All trades are denominated and settled in USDC on the Base blockchain.</li>
      </ul>
      <p>The Platform is provided for informational and trading purposes. Nothing on the Platform constitutes financial, investment, legal, or tax advice.</p>

      <h2>4. Account Registration and Security</h2>

      <h3>4.1 Account Creation</h3>
      <p>You may create an account by connecting a Web3 wallet, or signing in via Google or Telegram. Account creation is automatic upon first authentication.</p>

      <h3>4.2 Account Security</h3>
      <p>You are solely responsible for:</p>
      <ul>
        <li>Maintaining the security and confidentiality of your wallet private keys, authentication credentials, and account access.</li>
        <li>All activities that occur under your account, whether or not authorized by you.</li>
        <li>Promptly notifying us of any unauthorized access or security breach.</li>
      </ul>
      <p>We are not liable for losses resulting from unauthorized use of your account due to your failure to maintain adequate security.</p>

      <h3>4.3 Account Information</h3>
      <p>You agree to provide accurate and current information and to update it as necessary. We reserve the right to suspend or terminate accounts with inaccurate or fraudulent information.</p>

      <h2>5. Trading and Risk Disclosure</h2>

      <h3>5.1 Nature of Prediction Markets</h3>
      <p>Outcome contracts on OmenX represent positions on the probability of real-world events. Contract prices range from $0.00 to $1.00 (USDC), where $1.00 represents certainty of an outcome occurring.</p>

      <h3>5.2 Risk Acknowledgment</h3>
      <p>By using the Platform, you acknowledge and accept that:</p>
      <ul>
        <li>Trading outcome contracts involves substantial risk of loss, including the potential loss of your entire deposited funds.</li>
        <li>Leveraged trading amplifies both gains and losses. Higher leverage increases the risk of liquidation.</li>
        <li><strong>Liquidation risk:</strong> If your account's risk ratio exceeds maintenance margin requirements, positions may be partially or fully liquidated automatically.</li>
        <li><strong>Market volatility:</strong> Prices of outcome contracts can change rapidly and unpredictably.</li>
        <li><strong>Funding rates:</strong> Open positions may be subject to periodic funding rate charges or payments.</li>
        <li><strong>Settlement risk:</strong> Markets are resolved based on predetermined data sources and resolution criteria. Resolution outcomes are final.</li>
        <li><strong>Smart contract risk:</strong> The Platform operates on blockchain-based smart contracts, which may contain bugs or vulnerabilities despite security audits.</li>
        <li><strong>No guaranteed returns:</strong> Past trading performance does not indicate future results.</li>
      </ul>

      <h3>5.3 Not Financial Advice</h3>
      <p>The Platform, including any data, prices, charts, indicators, or market information displayed, is provided for informational purposes only and does not constitute financial, investment, or trading advice. You should consult with qualified professionals before making any trading decisions.</p>

      <h3>5.4 No Recourse</h3>
      <p>You agree that all trades are executed at your own risk. OmenX does not guarantee the accuracy, timeliness, or completeness of any market data or resolution outcomes.</p>

      <h2>6. Fees</h2>

      <h3>6.1 Trading Fees</h3>
      <p>Trades executed on the Platform are subject to trading fees as displayed at the time of order placement. Fee rates may vary by market type and are subject to change.</p>

      <h3>6.2 Funding Rates</h3>
      <p>Open leveraged positions may incur funding rate charges at regular intervals. Current funding rates are displayed on the trading interface.</p>

      <h3>6.3 Blockchain Gas Fees</h3>
      <p>Deposits, withdrawals, and certain on-chain operations may incur network gas fees on the Base blockchain. These fees are paid directly to network validators and are not collected by OmenX.</p>

      <h3>6.4 Fee Changes</h3>
      <p>We reserve the right to modify fee structures at any time. Updated fees will be reflected on the Platform prior to taking effect.</p>

      <h2>7. Deposits and Withdrawals</h2>

      <h3>7.1 Supported Assets</h3>
      <p>The Platform currently supports USDC on the Base blockchain for deposits and withdrawals.</p>

      <h3>7.2 Deposit and Withdrawal Processing</h3>
      <p>You are responsible for ensuring deposits are sent to the correct address on the correct network. Funds sent to incorrect addresses or unsupported networks may be permanently lost and are not recoverable by OmenX.</p>

      <h3>7.3 Withdrawal Restrictions</h3>
      <p>We may delay or restrict withdrawals in cases of suspected fraud, security concerns, regulatory requirements, or system maintenance.</p>

      <h2>8. Market Resolution and Settlement</h2>

      <h3>8.1 Resolution Process</h3>
      <p>Markets are resolved based on predetermined data sources and resolution criteria specified in each market's Event Info. Resolution outcomes are determined by objective, verifiable data.</p>

      <h3>8.2 Dispute Resolution</h3>
      <p>If a market resolution is disputed, OmenX may review the resolution using the dispute resolution process described in the market's resolution criteria. OmenX's determination is final.</p>

      <h3>8.3 Settlement</h3>
      <p>Upon market resolution, winning positions are settled at $1.00 per contract and losing positions at $0.00. Settlement is processed automatically to your account balance.</p>

      <h2>9. Prohibited Activities</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Platform for any illegal purpose or in violation of any applicable law or regulation.</li>
        <li>Manipulate markets, prices, or trading activity through wash trading, spoofing, layering, or other deceptive practices.</li>
        <li>Use bots, scripts, or automated tools to gain unfair advantages, unless through officially supported APIs.</li>
        <li>Attempt to exploit, hack, reverse-engineer, or interfere with the Platform's smart contracts, infrastructure, or security systems.</li>
        <li>Create multiple accounts to circumvent restrictions, abuse referral programs, or manipulate leaderboard rankings.</li>
        <li>Provide false or misleading information during account registration or verification.</li>
        <li>Use the Platform to launder money, finance terrorism, or evade sanctions.</li>
        <li>Harass, threaten, or defraud other users.</li>
        <li>Scrape, crawl, or harvest data from the Platform without authorization.</li>
      </ul>
      <p>We reserve the right to investigate, suspend, or terminate accounts engaged in prohibited activities and to report such activities to relevant authorities.</p>

      <h2>10. Intellectual Property</h2>

      <h3>10.1 OmenX Property</h3>
      <p>The Platform, including its design, code, content, branding, logos, and trademarks, is the exclusive property of OmenX and is protected by applicable intellectual property laws. You may not copy, modify, distribute, or create derivative works without our prior written consent.</p>

      <h3>10.2 User Content</h3>
      <p>By submitting content to the Platform (e.g., usernames, profile information), you grant OmenX a non-exclusive, worldwide, royalty-free license to use, display, and distribute such content in connection with the Platform's operation.</p>

      <h2>11. Disclaimer of Warranties</h2>
      <p>THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY. TO THE FULLEST EXTENT PERMITTED BY LAW, OMENX DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:</p>
      <ul>
        <li>MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</li>
        <li>THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR HARMFUL COMPONENTS.</li>
        <li>THAT ANY INFORMATION, DATA, OR CONTENT ON THE PLATFORM IS ACCURATE, RELIABLE, OR COMPLETE.</li>
        <li>THAT SMART CONTRACTS UNDERLYING THE PLATFORM ARE FREE FROM BUGS OR VULNERABILITIES.</li>
      </ul>

      <h2>12. Limitation of Liability</h2>
      <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL OMENX, ITS OFFICERS, DIRECTORS, EMPLOYEES, AFFILIATES, OR AGENTS BE LIABLE FOR:</p>
      <ul>
        <li>ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.</li>
        <li>ANY LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL.</li>
        <li>ANY LOSS OF DIGITAL ASSETS, INCLUDING USDC OR OTHER TOKENS.</li>
        <li>ANY DAMAGES ARISING FROM SMART CONTRACT FAILURES, BLOCKCHAIN NETWORK ISSUES, OR THIRD-PARTY SERVICE DISRUPTIONS.</li>
        <li>ANY DAMAGES EXCEEDING THE TOTAL FEES PAID BY YOU TO OMENX IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM.</li>
      </ul>

      <h2>13. Indemnification</h2>
      <p>You agree to indemnify, defend, and hold harmless OmenX and its officers, directors, employees, and affiliates from and against any claims, liabilities, damages, losses, costs, and expenses (including reasonable attorney's fees) arising from:</p>
      <ul>
        <li>Your use of the Platform.</li>
        <li>Your violation of these Terms.</li>
        <li>Your violation of any applicable law or regulation.</li>
        <li>Your violation of any third-party rights.</li>
      </ul>

      <h2>14. Modifications to the Platform and Terms</h2>

      <h3>14.1 Platform Changes</h3>
      <p>We reserve the right to modify, suspend, or discontinue any part of the Platform at any time without prior notice. We are not liable for any modification, suspension, or discontinuation.</p>

      <h3>14.2 Terms Updates</h3>
      <p>We may update these Terms from time to time. Material changes will be communicated by posting the revised Terms on this page with an updated "Last Updated" date. Your continued use of the Platform after changes are posted constitutes acceptance of the revised Terms.</p>

      <h2>15. Termination</h2>

      <h3>15.1 By You</h3>
      <p>You may close your account at any time by ceasing to use the Platform. You remain responsible for all open positions and obligations incurred prior to termination.</p>

      <h3>15.2 By OmenX</h3>
      <p>We may suspend or terminate your access to the Platform at any time, with or without cause, with or without notice. Reasons may include violation of these Terms, legal or regulatory requirements, fraud prevention, or operational necessity.</p>

      <h3>15.3 Effect of Termination</h3>
      <p>Upon termination, your right to use the Platform ceases immediately. Sections regarding intellectual property, disclaimers, limitations of liability, indemnification, and dispute resolution survive termination.</p>

      <h2>16. Governing Law and Dispute Resolution</h2>
      <p>These Terms shall be governed by and construed in accordance with the laws of the Cayman Islands, without regard to conflict of law principles.</p>
      <p>Any dispute arising from or relating to these Terms or the Platform shall be resolved through binding arbitration administered under the rules of the Singapore International Arbitration Centre (SIAC). The arbitration shall be conducted in Singapore in the English language. The arbitrator's decision shall be final and enforceable in any court of competent jurisdiction.</p>
      <p>You agree to waive any right to participate in a class action lawsuit or class-wide arbitration.</p>

      <h2>17. Miscellaneous</h2>
      <ul>
        <li><strong>Entire Agreement:</strong> These Terms, together with the Privacy Policy, constitute the entire agreement between you and OmenX regarding the Platform.</li>
        <li><strong>Severability:</strong> If any provision is found to be unenforceable, the remaining provisions shall continue in full force and effect.</li>
        <li><strong>Waiver:</strong> Our failure to enforce any right or provision shall not constitute a waiver of that right or provision.</li>
        <li><strong>Assignment:</strong> You may not assign your rights under these Terms. OmenX may assign its rights without restriction.</li>
        <li><strong>Force Majeure:</strong> OmenX is not liable for failure to perform due to circumstances beyond our reasonable control, including but not limited to natural disasters, war, government actions, network failures, or blockchain congestion.</li>
      </ul>

      <h2>18. Contact Us</h2>
      <p>If you have questions about these Terms, please contact us:</p>
      <ul>
        <li><strong>Email:</strong> support@omenx.com</li>
        <li><strong>Website:</strong>{" "}
          <a href="https://omenx.com" target="_blank" rel="noopener noreferrer">https://omenx.com</a>
        </li>
      </ul>

      <p className="mt-8 text-xs italic" style={{ color: "hsl(var(--muted-foreground) / 0.6)" }}>
        These Terms of Service were last updated on 30 March, 2026.
      </p>
    </SeoPageLayout>
  );
};

export default TermsOfServicePage;
