export const metadata = {
  title: 'Privacy Policy - Hardware Store',
  description: 'Read our privacy policy',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-gray-600 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="prose prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Hardware Store (&quot;we&quot; or &quot;us&quot; or &quot;our&quot;) operates the
              hardwarestore.ug website (the &quot;Site&quot;). This page informs you of our policies
              regarding the collection, use, and disclosure of personal data when you use our Site
              and the choices you have associated with that data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Information Collection and Use</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We collect several different types of information for various purposes to provide and
              improve our Service to you.
            </p>

            <h3 className="text-lg font-semibold mb-3">Types of Data Collected:</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Personal Data: Name, email address, phone number, address, etc.</li>
              <li>
                Usage Data: Browser type, IP address, pages visited, time and date of visits, etc.
              </li>
              <li>Payment Information: Credit/debit card details (processed securely)</li>
              <li>Cookies and Tracking Technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Use of Data</h2>
            <p className="text-gray-700 leading-relaxed">
              Hardware Store uses the collected data for various purposes:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mt-4">
              <li>To provide and maintain the Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To allow you to participate in interactive features of our Service</li>
              <li>To provide customer service and respond to your requests</li>
              <li>To gather analysis or valuable information so we can improve our Service</li>
              <li>To monitor the usage of our Service</li>
              <li>To detect, prevent and address technical and security issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Security of Data</h2>
            <p className="text-gray-700 leading-relaxed">
              The security of your data is important to us, but remember that no method of
              transmission over the Internet or method of electronic storage is 100% secure. While
              we strive to use commercially acceptable means to protect your Personal Data, we
              cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot;
              date at the top of this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us:
              <br />
              <strong>Email:</strong> privacy@hardwarestore.ug
              <br />
              <strong>Phone:</strong> +256 701 234 567
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mt-4">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Data portability</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  )
}
