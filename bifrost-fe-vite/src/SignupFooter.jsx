export default function Footer() {
  return (
    <footer
      className="w-full bg-cover bg-center text-gray-200 py-12"
      style={{ backgroundImage: "url('/Aesir-Twiddle.jpg')" }}
    >
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-8 md:space-y-0">

        {/* Logo & Description stacked */}
        <div className="flex flex-col items-start space-y-2">
        <img 
            src="/aesir-logo3-blue.png" 
            alt="Aesir Systems" 
            className="h-12 w-auto" 
        />
        <p className="max-w-sm text-sm">
            Aesir Systems – Seamless connectivity solutions for modern living. 
            Contact us for installation, support, and more.
        </p>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col space-y-2 text-sm text-black -mt-4 md:-mt-15">
          <p><strong>Address:</strong> Unit 20, Block B, M5 Park, Eastman Road, Maitland, Cape Town</p>
          <p><strong>Phone:</strong> +27 21 002 5049</p>
          <p><strong>Email:</strong> support@aesir.co.za</p>
        </div>

        {/* Social Links */}
        <div className="flex space-x-4 text-black">
          <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            Facebook
          </a>
          <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            Twitter
          </a>
          <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            LinkedIn
          </a>
        </div>

      </div>

      {/* Copyright */}
      <div className="mt-8 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} Aesir Systems. All rights reserved.
      </div>
    </footer>
  );
}
