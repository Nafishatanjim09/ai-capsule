export default function Landing() {
  return (
    <div className="page landing">
      <div className="ticket">
        <p className="ticket-label">Prompt archive</p>
        <h1>AI Capsule</h1>
        <p className="ticket-lede">
          Every prompt worth keeping, filed in one place. Sign in to start a private
          record of what you asked, what came back, and whether it actually worked.
        </p>

        <div className="ticket-rule" />

        <dl className="ticket-facts">
          <div>
            <dt>Catalogued by project</dt>
            <dd>Group prompts by assignment, version, and category as you go.</dd>
          </div>
          <div>
            <dt>Rated, not just saved</dt>
            <dd>Mark what was useful, what got reviewed, and what still needs work.</dd>
          </div>
          <div>
            <dt>Yours alone</dt>
            <dd>Signed in with GitHub — your capsules never appear in anyone else's list.</dd>
          </div>
        </dl>

        <a className="btn btn-primary" href="/login">
          Login with GitHub
        </a>
      </div>
    </div>
  );
}
