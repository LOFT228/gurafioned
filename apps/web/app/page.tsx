const navItems = ["Home", "Ideas", "Systems"];

const designIdeas = [
  {
    eyebrow: "01",
    title: "Launch-world identity",
    copy: "A punchy mini-brand with mascot moments, sticker language, motion cues, and social-ready launch graphics.",
    color: "bg-[#33caff]",
    tilt: "-rotate-2",
  },
  {
    eyebrow: "02",
    title: "App that feels alive",
    copy: "Micro-interactions, confident empty states, onboarding cards, and playful product illustrations for the first 5 minutes.",
    color: "bg-[#ffe475]",
    tilt: "rotate-1",
  },
  {
    eyebrow: "03",
    title: "Conversion candy",
    copy: "A landing page system built around big proof blocks, magnetic CTAs, weird-good visuals, and high-trust pricing.",
    color: "bg-[#ff7fe5]",
    tilt: "rotate-2",
  },
];

const studioNotes = [
  "Moodboard in 48h",
  "3 wild directions",
  "Clickable hero prototype",
  "Design system starter",
  "Launch asset pack",
];

const systemTiles = [
  { label: "Hot pink", value: "#ff66c8", className: "bg-[#ff66c8]" },
  { label: "Signal yellow", value: "#ffd600", className: "bg-[#ffd600]" },
  { label: "Pool blue", value: "#33caff", className: "bg-[#33caff]" },
  { label: "Ink", value: "#121212", className: "bg-[#121212]" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#121212] p-2 text-[#121212]">
      <section className="relative mx-auto flex min-h-[calc(100vh-16px)] max-w-[1504px] flex-col overflow-hidden rounded-t-[40px] bg-[#ff66c8] px-5 pb-16 pt-5 sm:px-8 lg:min-h-[688px]">
        <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(90deg,#33caff_0%,#8169ff_25%,#ff7fe5_48%,#ffe475_70%,#2fffe7_100%)] opacity-0" />
        <FloatingShapes />

        <header className="relative z-20 mx-auto flex w-full max-w-[1200px] items-center justify-between gap-6 py-3">
          <a
            href="#home"
            aria-label="Crazy Creative home"
            className="group flex h-[59px] w-[152px] items-center justify-center"
          >
            <CrazyLogo />
          </a>

          <nav className="hidden items-center gap-2 rounded-full md:flex">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="rounded-full px-6 py-5 text-lg leading-none text-[#121212] transition hover:bg-white/20"
              >
                {item}
              </a>
            ))}
          </nav>

          <a
            href="#book"
            className="hidden rounded-full bg-[#ffd600] px-6 py-5 text-lg leading-none text-[#121212] transition hover:-translate-y-0.5 md:inline-flex"
          >
            Start a Sprint
          </a>
        </header>

        <div
          id="home"
          className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center justify-end gap-8 px-1 pb-8 pt-20 text-center lg:pt-28"
        >
          <div className="relative h-16 w-[90px]">
            <img
              src="https://framerusercontent.com/images/agiYpah4H5cS2Jj9Y7mEbzVJw.png?width=529&height=377"
              alt="Wow"
              className="h-16 w-[90px] object-contain"
            />
          </div>

          <p className="rounded-full bg-white/25 px-5 py-2 text-base tracking-[-0.03em] backdrop-blur">
            Ideas first. Interfaces second. Boring never.
          </p>

          <h1 className="max-w-[940px] text-[clamp(4.4rem,10.5vw,8.125rem)] font-normal leading-[0.86] tracking-[-0.02em] text-[#121212]">
            Design that&apos;s crazy good.
          </h1>

          <p className="max-w-[520px] text-[clamp(1.35rem,2.2vw,1.75rem)] font-normal leading-[1.39] tracking-[-0.04em] text-[#121212]">
            Websites, apps, and visual systems for startups that need an
            unforgettable first impression.
          </p>

          <a
            href="#book"
            className="group relative inline-flex h-[78px] w-[154px] items-center justify-center overflow-hidden rounded-full bg-[#ffd600] text-lg text-[#121212]"
          >
            <span className="transition duration-300 group-hover:-translate-y-16">
              Book a Call
            </span>
            <span className="absolute translate-y-16 transition duration-300 group-hover:translate-y-0">
              Bring Ideas
            </span>
          </a>
        </div>

        <img
          src="https://framerusercontent.com/images/SUTUrmpseBHvVOgv4OPWcE8bI.svg?width=1534&height=998"
          alt=""
          className="pointer-events-none absolute -bottom-[32rem] left-1/2 z-0 hidden w-[130vw] max-w-none -translate-x-[62%] opacity-100 sm:block"
        />
        <img
          src="https://framerusercontent.com/images/OLp9denw0v5J16q9OJV2Ys0dZ28.svg?width=588&height=1111"
          alt=""
          className="pointer-events-none absolute -bottom-[30rem] left-1/2 z-0 hidden w-[45rem] max-w-none -translate-x-[-5%] opacity-100 sm:block"
        />
      </section>

      <section
        id="ideas"
        className="mx-auto grid max-w-[1504px] gap-2 bg-[#121212] py-2 lg:grid-cols-[0.92fr_1.08fr]"
      >
        <div className="rounded-[40px] bg-[#33caff] p-8 sm:p-12 lg:p-14">
          <p className="mb-5 text-lg tracking-[-0.04em]">Original concepts</p>
          <h2 className="max-w-[640px] text-[clamp(3.7rem,8vw,7.5rem)] leading-[0.86] tracking-[-0.05em]">
            More ideas. More weird. More wow.
          </h2>
          <p className="mt-8 max-w-[520px] text-2xl leading-[1.15] tracking-[-0.04em]">
            The page now sells a design studio that can invent directions, not
            just decorate screens. Every block is built to feel like a pitch
            board.
          </p>
        </div>

        <div className="grid gap-2">
          {designIdeas.map((idea) => (
            <article
              key={idea.title}
              className={`${idea.color} ${idea.tilt} rounded-[36px] border-4 border-[#121212] p-7 shadow-[8px_8px_0_#121212] transition hover:rotate-0 sm:p-9`}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="rounded-full bg-[#121212] px-4 py-2 text-sm text-white">
                  {idea.eyebrow}
                </span>
                <span className="text-5xl leading-none">✦</span>
              </div>
              <h3 className="mt-8 max-w-[520px] text-[clamp(2.25rem,5vw,4.5rem)] leading-[0.9] tracking-[-0.05em]">
                {idea.title}
              </h3>
              <p className="mt-5 max-w-[600px] text-xl leading-[1.25] tracking-[-0.03em]">
                {idea.copy}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1504px] gap-2 bg-[#121212] pb-2 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="relative min-h-[620px] overflow-hidden rounded-[40px] bg-[#ffe475] p-8 sm:p-12 lg:p-14">
          <div className="absolute -right-24 top-10 h-64 w-64 rounded-full bg-[#ff66c8]" />
          <div className="absolute bottom-16 right-16 h-28 w-28 rotate-12 rounded-[2rem] bg-[#33caff]" />
          <div className="absolute bottom-32 left-10 h-40 w-40 -rotate-12 rounded-full bg-[#2fffe7]" />

          <div className="relative z-10 max-w-[720px]">
            <p className="mb-5 text-lg tracking-[-0.04em]">Design playground</p>
            <h2 className="text-[clamp(3.4rem,7.7vw,7rem)] leading-[0.86] tracking-[-0.05em]">
              Your product should have a main character.
            </h2>
            <p className="mt-8 max-w-[530px] text-2xl leading-[1.15] tracking-[-0.04em]">
              Mascots, sticker systems, delight states, bold color logic, and
              launch visuals give people something to remember after the tab
              closes.
            </p>
          </div>

          <div className="absolute bottom-8 right-8 z-10 hidden w-[330px] rotate-3 rounded-[32px] border-4 border-[#121212] bg-white p-5 shadow-[10px_10px_0_#121212] md:block">
            <div className="mb-16 flex gap-2">
              <span className="h-4 w-4 rounded-full bg-[#ff66c8]" />
              <span className="h-4 w-4 rounded-full bg-[#ffd600]" />
              <span className="h-4 w-4 rounded-full bg-[#33caff]" />
            </div>
            <p className="text-4xl leading-[0.9] tracking-[-0.05em]">
              Make the scroll feel collectible.
            </p>
          </div>
        </div>

        <aside className="rounded-[40px] bg-[#ff7fe5] p-8 sm:p-12 lg:p-14">
          <p className="mb-6 text-lg tracking-[-0.04em]">Sprint menu</p>
          <div className="space-y-3">
            {studioNotes.map((note) => (
              <div
                key={note}
                className="flex items-center justify-between gap-4 rounded-full bg-white/35 px-5 py-4 text-xl tracking-[-0.04em]"
              >
                <span>{note}</span>
                <span aria-hidden="true">→</span>
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-[32px] bg-[#121212] p-6 text-white">
            <p className="text-[clamp(2rem,4vw,3.5rem)] leading-[0.9] tracking-[-0.05em]">
              One week to turn fuzzy ideas into a loud visual direction.
            </p>
          </div>
        </aside>
      </section>

      <section
        id="systems"
        className="mx-auto max-w-[1504px] rounded-b-[40px] bg-white px-6 py-16 sm:px-10 lg:px-14"
      >
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="mb-5 text-lg tracking-[-0.04em]">Visual system</p>
            <h2 className="text-[clamp(3.2rem,7vw,6.5rem)] leading-[0.86] tracking-[-0.05em]">
              A brand kit that keeps the chaos useful.
            </h2>
          </div>
          <p className="max-w-[640px] text-2xl leading-[1.16] tracking-[-0.04em] lg:justify-self-end">
            The design language is intentionally loud, but packaged into
            repeatable colors, layout rhythms, CTAs, cards, and proof moments
            so the product can keep shipping without losing personality.
          </p>
        </div>

        <div className="mt-12 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {systemTiles.map((tile) => (
            <div
              key={tile.label}
              className={`${tile.className} min-h-[260px] rounded-[34px] p-6 text-white shadow-[inset_0_0_0_2px_rgba(18,18,18,0.12)]`}
            >
              <p className="text-2xl tracking-[-0.04em]">{tile.label}</p>
              <p className="mt-2 text-lg opacity-80">{tile.value}</p>
            </div>
          ))}
        </div>

        <div
          id="book"
          className="mt-2 grid gap-2 overflow-hidden rounded-[36px] bg-[#121212] p-3 text-white lg:grid-cols-[1fr_auto]"
        >
          <div className="rounded-[28px] bg-[#ff66c8] p-8 text-[#121212] sm:p-10">
            <p className="text-[clamp(2.8rem,7vw,6.5rem)] leading-[0.86] tracking-[-0.05em]">
              Want the next version even louder?
            </p>
          </div>
          <a
            href="mailto:hello@crazycreative.design"
            className="flex min-h-[180px] items-center justify-center rounded-[28px] bg-[#ffd600] px-10 text-center text-3xl leading-none tracking-[-0.05em] text-[#121212] transition hover:bg-[#33caff]"
          >
            Pitch the project
          </a>
        </div>
      </section>
    </main>
  );
}

function CrazyLogo() {
  return (
    <div className="relative h-[59px] w-[152px]">
      <img
        src="https://framerusercontent.com/images/Ym8TuTaIPLi1T4qFVLQAb4kpJc.svg?width=514&height=207"
        alt="Crazy Creative"
        className="h-full w-full object-contain"
      />
    </div>
  );
}

function FloatingShapes() {
  return (
    <>
      <div className="absolute left-[11%] top-[18%] h-24 w-24 rotate-12 rounded-[2rem] bg-white/20 blur-[1px]" />
      <div className="absolute right-[9%] top-[28%] h-28 w-28 rounded-full bg-[#ffe475]/50" />
      <div className="absolute bottom-[18%] left-[12%] h-36 w-36 rounded-full bg-[#2fffe7]/30 blur-sm" />
      <div className="absolute right-[24%] top-[13%] h-16 w-40 -rotate-6 rounded-full bg-white/30" />
      <div className="absolute bottom-[31%] right-[12%] h-20 w-20 rotate-45 bg-[#8169ff]/30" />
    </>
  );
}
