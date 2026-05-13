const navItems = ["Home", "Services", "About"];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#121212] p-2">
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
            href="#certified"
            className="hidden rounded-full bg-[#ffd600] px-6 py-5 text-lg leading-none text-[#121212] transition hover:-translate-y-0.5 md:inline-flex"
          >
            Get Certified
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

          <h1 className="max-w-[900px] text-[clamp(4.6rem,11vw,8.125rem)] font-normal leading-[0.86] tracking-[-0.02em] text-[#121212]">
            Design that&apos;s crazy good.
          </h1>

          <p className="max-w-[453px] text-[clamp(1.35rem,2.2vw,1.75rem)] font-normal leading-[1.39] tracking-[-0.04em] text-[#121212]">
            Website &amp; app design for startups that want to sleep easy after
            launch.
          </p>

          <a
            href="#book"
            className="group relative inline-flex h-[78px] w-[141px] items-center justify-center overflow-hidden rounded-full bg-[#ffd600] text-lg text-[#121212]"
          >
            <span className="transition duration-300 group-hover:-translate-y-16">
              Book a Call
            </span>
            <span className="absolute translate-y-16 transition duration-300 group-hover:translate-y-0">
              Book a Call
            </span>
          </a>
        </div>

        <img
          src="https://framerusercontent.com/images/SUTUrmpseBHvVOgv4OPWcE8bI.svg?width=1534&height=998"
          alt=""
          className="pointer-events-none absolute -bottom-[32rem] left-1/2 z-0 w-[130vw] max-w-none -translate-x-[62%] opacity-100"
        />
        <img
          src="https://framerusercontent.com/images/OLp9denw0v5J16q9OJV2Ys0dZ28.svg?width=588&height=1111"
          alt=""
          className="pointer-events-none absolute -bottom-[30rem] left-1/2 z-0 w-[45rem] max-w-none -translate-x-[-5%] opacity-100"
        />
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
