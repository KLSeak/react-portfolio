import KleeCanvas from './KleeCanvas'

export default function Header() {
  return (
    <div className="w-11/12 max-w-5xl mx-auto h-screen flex items-center">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center w-full">


        {/* LEFT — your text */}
        <div className="flex flex-col items-center lg:items-start gap-4 text-center lg:text-left">
          <h3 className="flex items-end gap-2 text-xl md:text-2xl font-Ovo">
            Hi! I'm LeangSeak
            <img src="./assets/hand-icon.png" alt="" className="w-6 mb-1" />
          </h3>
          <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-Ovo leading-tight">
            Frontend web developer based in Kampong Spue.
          </h1>
          <p className="max-w-md font-Ovo text-gray-600 dark:text-gray-300">
            I am a Frontend developer from Kampong Spue, Cambodia with some
            experience of Teaching and Sharing!
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
            <a
              href="#contact"
              className="px-10 py-2.5 border rounded-full bg-gradient-to-r from-[#b820e6] to-[#da7d20] text-white flex items-center gap-2 dark:border-transparent"
            >
              contact me{' '}
              <img src="./assets/right-arrow-white.png" alt="" className="w-4" />
            </a>
            <a
              href="https://docs.google.com/document/d/1fWtgNbqgCM5HCn-Z4XlXnStqNDM1DnP6/edit?usp=sharing&ouid=103129139587891088758&rtpof=true&sd=true"
              target="_blank"
              rel="noreferrer"
              className="px-10 py-2.5 rounded-full border border-gray-300 dark:border-white/25 hover:bg-slate-100/70 dark:hover:bg-darkHover flex items-center gap-2 bg-white dark:bg-transparent dark:text-white"
            >
              my resume{' '}
              <img src="./assets/download-icon.png" alt="" className="w-4 dark:invert" />
            </a>
          </div>
        </div>

        {/* RIGHT — Klee! */}
        <div className="w-full h-[300px] sm:h-[400px] lg:h-auto">
          <KleeCanvas />
        </div>

      </div>
    </div>
  )
}
