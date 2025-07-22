import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingPage() {
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (isAnimating) return;

    setIsAnimating(true);

    // Navigate after animation starts
    setTimeout(() => {
      navigate("/login");
    }, 300);
  };

  return (
    <div
      className="relative h-screen w-full overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://cdn.builder.io/api/v1/image/assets%2F1faf75f2416d4b1fb6aa1dd18d77b8fd%2Fa720df2043014d70b09d9f694d733cef?format=webp&width=1200')`,
        }}
      >
        {/* Blue tinted overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-blue-800/60 to-slate-700/70" />

        {/* Blur effect overlay */}
        <div className="absolute inset-0 backdrop-blur-sm" />
      </div>

      {/* Content */}
      <AnimatePresence>
        {!isAnimating && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 flex items-center justify-center h-full"
          >
            <div className="text-center text-white px-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-8 flex justify-center"
              >
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F1faf75f2416d4b1fb6aa1dd18d77b8fd%2F50d730adc57f4491b72ec9340fff51e5?format=webp&width=400"
                  alt="CSIR CRRI Logo"
                  className="h-16 w-auto md:h-20 lg:h-24"
                />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight"
              >
                Welcome to
              </motion.h1>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-3xl md:text-5xl lg:text-6xl font-bold mt-2 leading-tight"
              >
                CSIR CRRI Canteen
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="mt-12"
              >
                <div className="inline-block px-8 py-3 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                  <p className="text-lg md:text-xl font-medium text-white/90">
                    Tap anywhere to continue
                  </p>
                </div>
              </motion.div>

              {/* Floating animation indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.2 }}
                className="mt-8"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="inline-block"
                >
                  <svg
                    className="w-6 h-6 text-white/70"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sliding Up Animation Overlay */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0 z-20 bg-gradient-to-br from-muted via-background to-muted"
          />
        )}
      </AnimatePresence>

      {/* Ambient light effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Organization branding footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <div className="text-center text-white/60">
          <p className="text-sm font-medium">
            Council of Scientific & Industrial Research
          </p>
          <p className="text-xs mt-1">Central Road Research Institute</p>
        </div>
      </motion.div>
    </div>
  );
}
