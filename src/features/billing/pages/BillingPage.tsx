export default function BillingPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and usage</p>
      </div>

      {/* Current Plan */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">Free</p>
            <p className="text-sm text-muted-foreground">Limited to 30 minutes/month</p>
          </div>
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Upgrade
          </button>
        </div>
      </div>

      {/* Usage */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Usage This Month</h2>
        <div className="space-y-4">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>Conversation time</span>
              <span>0 / 30 minutes</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 w-0 rounded-full bg-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Plans</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { name: 'Starter', price: '$9', minutes: '120' },
            { name: 'Pro', price: '$29', minutes: '500' },
            { name: 'Unlimited', price: '$49', minutes: 'Unlimited' },
          ].map((plan) => (
            <div key={plan.name} className="rounded-lg border p-6">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-2 text-3xl font-bold">
                {plan.price}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{plan.minutes} minutes/month</p>
              <button className="mt-4 w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
                Select
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
