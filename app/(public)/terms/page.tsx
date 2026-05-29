export const metadata = {
  title: 'Terms and Conditions - Hardware Store',
  description: 'Read our terms and conditions',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold">Terms and Conditions</h1>
          <p className="text-gray-600 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="prose prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using this website, you accept and agree to be bound by the terms
              and provision of this agreement. If you do not agree to abide by the above, please
              do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Use License</h2>
            <p className="text-gray-700 leading-relaxed">
              Permission is granted to temporarily download one copy of the materials (information
              or software) on Hardware Store&apos;s website for personal, non-commercial transitory
              viewing only. This is the grant of a license, not a transfer of title, and under
              this license you may not:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mt-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to decompile or reverse engineer any software contained on the website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or &quot;mirror&quot; the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed">
              The materials on Hardware Store&apos;s website are provided on an &apos;as is&apos;
              basis. Hardware Store makes no warranties, expressed or implied, and hereby disclaims
              and negates all other warranties including, without limitation, implied warranties
              or conditions of merchantability, fitness for a particular purpose, or non-infringement
              of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Limitations</h2>
            <p className="text-gray-700 leading-relaxed">
              In no event shall Hardware Store or its suppliers be liable for any damages
              (including, without limitation, damages for loss of data or profit, or due to
              business interruption) arising out of the use or inability to use the materials on
              Hardware Store&apos;s website, even if Hardware Store or an authorized representative
              has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Accuracy of Materials</h2>
            <p className="text-gray-700 leading-relaxed">
              The materials appearing on Hardware Store&apos;s website could include technical,
              typographical, or photographic errors. Hardware Store does not warrant that any of
              the materials on its website are accurate, complete, or current. Hardware Store may
              make changes to the materials contained on its website at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Links</h2>
            <p className="text-gray-700 leading-relaxed">
              Hardware Store has not reviewed all of the sites linked to its website and is not
              responsible for the contents of any such linked site. The inclusion of any link does
              not imply endorsement by Hardware Store of the site. Use of any such linked website
              is at the user&apos;s own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Modifications</h2>
            <p className="text-gray-700 leading-relaxed">
              Hardware Store may revise these terms of service for its website at any time without
              notice. By using this website, you are agreeing to be bound by the then current
              version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These terms and conditions are governed by and construed in accordance with the laws
              of Uganda, and you irrevocably submit to the exclusive jurisdiction of the courts
              located in Uganda.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms and Conditions, please contact us at:
              <br />
              <strong>Email:</strong> support@hardwarestore.ug
              <br />
              <strong>Phone:</strong> +256 701 234 567
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
