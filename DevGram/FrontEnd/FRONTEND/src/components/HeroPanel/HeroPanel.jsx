import './HeroPanel.css'
import DevGramLogo from '../icons/DevGramLogo'

function HeroPanel() {
  return (
    <section className="hero-panel" aria-label="DevGram introduction">
      <header className="brand-header">
        <DevGramLogo size={48} />
        <span className="brand-name">DevGram</span>
      </header>

      <div className="hero-copy">
        <h1>
          See daily builds from your close{' '}
          <span>developer network.</span>
        </h1>
        <p>
          // A feed of code, commits, and creative chaos. Share screenshots,
          snippets, and shipped features with the people who actually get it.
        </p>
      </div>

      <figure className="feature-preview">
        <img
          src={`${import.meta.env.BASE_URL}image3.png`}
          alt="DevGram - developers collaborating with code overlays"
        />
      </figure>

      <footer className="hero-footer">
        &copy; DevGram - built for builders
      </footer>
    </section>
  )
}

export default HeroPanel
