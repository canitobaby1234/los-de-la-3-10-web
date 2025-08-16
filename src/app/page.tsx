import Link from 'next/link'
import Image from 'next/image'
import { FaFacebook, FaInstagram, FaWhatsapp, FaMusic, FaStar, FaVolumeUp } from 'react-icons/fa'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-100/30 via-transparent to-transparent"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-slate-200/20 to-blue-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {/* Logo Principal */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-white to-blue-50 p-8 rounded-full shadow-2xl border border-blue-200/50 backdrop-blur-sm">
                {/* Logo real */}
                <div className="w-32 h-32 md:w-40 md:h-40 relative">
                  <Image
                    src="/logo.png"
                    alt="Los de la 3-10"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-slate-700 via-blue-800 to-slate-900 bg-clip-text text-transparent">
              Audio e Iluminación
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-700/80 mb-8 leading-relaxed">
            Hacemos que tu evento suene y se vea espectacular. 
            <br className="hidden md:block" />
            Calidad, compromiso y experiencia en cada celebración.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="flex items-center bg-white/70 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-blue-200/50">
              <FaVolumeUp className="text-amber-600 mr-2" />
              <span className="text-slate-700 font-medium">Sonido Profesional</span>
            </div>
            <div className="flex items-center bg-white/70 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-blue-200/50">
              <FaStar className="text-amber-600 mr-2" />
              <span className="text-slate-700 font-medium">Iluminación LED</span>
            </div>
            <div className="flex items-center bg-white/70 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-blue-200/50">
              <FaMusic className="text-amber-600 mr-2" />
              <span className="text-slate-700 font-medium">Música en Vivo</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/+524272737288"
              className="inline-flex items-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaWhatsapp className="mr-2 text-xl" />
              Cotizar WhatsApp
            </a>
            <Link
              href="/auth"
              className="inline-flex items-center bg-gradient-to-r from-blue-600 to-slate-700 hover:from-blue-700 hover:to-slate-800 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-amber-400/20"
            >
              Panel Admin
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-slate-700 to-blue-800 bg-clip-text text-transparent">
              Nuestros Servicios
            </span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-white to-blue-50 p-8 rounded-2xl shadow-xl border border-blue-200/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center mb-6">
                <FaVolumeUp className="text-2xl text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-700 mb-4">Sonido Profesional</h3>
              <p className="text-slate-600 leading-relaxed">
                Sistemas de audio de calidad para eventos familiares y sociales. 
                Bocinas potentes, microfonía y mezcla profesional.
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-blue-50 p-8 rounded-2xl shadow-xl border border-blue-200/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center mb-6">
                <FaStar className="text-2xl text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-700 mb-4">Iluminación LED</h3>
              <p className="text-slate-600 leading-relaxed">
                Luces LED de colores que crean el ambiente perfecto para tu celebración. 
                Efectos dinámicos que transforman cualquier espacio.
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-blue-50 p-8 rounded-2xl shadow-xl border border-blue-200/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center mb-6">
                <FaMusic className="text-2xl text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-700 mb-4">Música y Animación</h3>
              <p className="text-slate-600 leading-relaxed">
                Selección musical para todos los gustos. Creamos el ambiente 
                perfecto para que tu evento sea inolvidable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-br from-blue-100 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-8">
            <span className="bg-gradient-to-r from-slate-700 to-blue-800 bg-clip-text text-transparent">
              Contáctanos
            </span>
          </h2>
          
          <p className="text-xl text-slate-700/80 mb-12">
            ¿Listo para hacer de tu evento algo especial?
          </p>

          <div className="flex flex-wrap justify-center gap-6">
            <a
              href="https://wa.me/+524272737288"
              className="flex items-center bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaWhatsapp className="mr-3 text-xl" />
              WhatsApp
            </a>
            
            <a
              href="https://facebook.com/losdela310"
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaFacebook className="mr-3 text-xl" />
              Facebook
            </a>
            
            <a
              href="https://instagram.com/losdela310"
              className="flex items-center bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaInstagram className="mr-3 text-xl" />
              Instagram
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-800 to-blue-900 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="mb-4">
            <span className="text-2xl font-bold">Los de la 3-10</span>
          </div>
          <p className="text-blue-200">
            © 2025 Los de la 3-10. Audio e iluminación para eventos especiales.
          </p>
        </div>
      </footer>
    </div>
  )
}