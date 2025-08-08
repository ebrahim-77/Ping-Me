const AuthImagePattern = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-12 relative overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-primary/10 blur-3xl"></div>
      <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full bg-secondary/10 blur-3xl"></div>
      
      {/* Main content */}
      <div className="relative z-10 max-w-md text-center">
        {/* Chat bubble illustration */}
        <div className="mb-12 flex justify-center">
          <div className="relative">
            {/* Main chat bubble */}
            <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/30 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-primary"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Floating message bubbles */}
            <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="w-3 h-3 rounded-full bg-secondary"></div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center animate-bounce" style={{ animationDuration: '3s', animationDelay: '1s' }}>
              <div className="w-2 h-2 rounded-full bg-accent"></div>
            </div>
          </div>
        </div>
        
        {/* Title and subtitle */}
        <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          {title}
        </h2>
        <p className="text-base-content/70 text-lg leading-relaxed">
          {subtitle}
        </p>
        
        {/* Decorative elements */}
        <div className="mt-12 flex justify-center gap-4">
          <div className="w-3 h-3 rounded-full bg-primary/30 animate-pulse"></div>
          <div className="w-3 h-3 rounded-full bg-secondary/30 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="w-3 h-3 rounded-full bg-accent/30 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default AuthImagePattern;