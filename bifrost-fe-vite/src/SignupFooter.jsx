import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faFacebook, faTwitter, faInstagram, faLinkedinIn, faYoutube} from "@fortawesome/free-brands-svg-icons";

export default function Footer() {
  return (
    <footer
      className="relative w-full bg-cover bg-center text-white py-8 md:py-12 lg:py-16"
      style={{ backgroundImage: "url('/Aesir-Twiddle.jpg')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-5 grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Logo & Description */}
        <div className="flex flex-col items-start space-y-3">
          <img 
            src="/aesir-logo3-blue.png" 
            alt="Aesir Systems" 
            className="h-10 md:h-12 lg:h-14 w-auto" 
          />
          <p className="text-sm md:text-base max-w-sm">
            Aesir Systems – Seamless connectivity solutions for modern living. 
            Contact us for installation, support, and more.
          </p>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col space-y-2 text-sm md:text-base">
          <p><strong>Address:</strong> Unit 20, Block B, M5 Park, Eastman Road, Maitland, Cape Town</p>
          <p><strong>Phone:</strong> +27 21 002 5049</p>
          <p><strong>Email:</strong> support@aesir.co.za</p>
        </div>

        {/* Social Links */}
        <div className="flex space-x-4 justify-start md:justify-end text-white text-xl">
          <a href="https://www.facebook.com/aesirsystems" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300">
            <FontAwesomeIcon icon={faFacebook} />
          </a>
          <a href="https://twitter.com/aesir_IT" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300">
            <FontAwesomeIcon icon={faTwitter} />
          </a>
          <a href="https://www.instagram.com/aesirsystems/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300">
            <FontAwesomeIcon icon={faInstagram} />
          </a>
          <a href="https://www.linkedin.com/company/35068383/admin/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300">
            <FontAwesomeIcon icon={faLinkedinIn} />
          </a>
          <a href="https://www.youtube.com/channel/UCBRs4WDh1Zrbz2hn7VTYJKw" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300">
            <FontAwesomeIcon icon={faYoutube} />
          </a>
        </div>
      </div>

      {/* Copyright */}
      <div className="relative mt-8 text-center text-xs md:text-sm text-gray-400">
        &copy; {new Date().getFullYear()} Aesir Systems. All rights reserved.
      </div>
    </footer>
  );
}