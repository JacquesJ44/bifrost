export default function SignupHeader() {
  return (
    <header className="w-full bg-gradient-to-r from-primary to-secondary text-primary-content">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col items-center text-center space-y-5">

          {/* Logo */}
          <img
            src="/aesir-logo3-blue.png"
            alt="Aesir Systems"
            className="h-12 md:h-14"
          />

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Fibre Sign-Up
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl text-base md:text-lg opacity-90">
            Seamless connectivity for modern living. Complete the form below and
            we’ll get your connection activated as quickly as possible.
          </p>

        </div>
      </div>
    </header>
  );
}
