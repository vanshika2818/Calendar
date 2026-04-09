import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// Monthly high-quality curated wallpapers for a premium cinematic feel
const monthlyHeroImages = [
  "https://images.unsplash.com/photo-1444464666168-49b626428081?q=80&w=2669&auto=format&fit=crop", // Jan
  "https://images.unsplash.com/photo-1483728642387-6c3ba6c6af8f?q=80&w=2600&auto=format&fit=crop", // Feb
  "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=2671&auto=format&fit=crop", // Mar
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2674&auto=format&fit=crop", // Apr
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2670&auto=format&fit=crop", // May
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2673&auto=format&fit=crop", // Jun
  "https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?q=80&w=2670&auto=format&fit=crop", // Jul
  "https://images.unsplash.com/photo-1445217143695-467124038776?q=80&w=2633&auto=format&fit=crop", // Aug
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop", // Sep
  "https://images.unsplash.com/photo-1473081556163-2a17de81fc97?q=80&w=2574&auto=format&fit=crop", // Oct
  "https://images.unsplash.com/photo-1476820865390-c52aeebb9891?q=80&w=2670&auto=format&fit=crop", // Nov
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2670&auto=format&fit=crop"  // Dec
];

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const commonHolidays = {
  "1-1": "New Year's Day",
  "2-14": "Valentine's Day",
  "3-17": "St. Patrick's Day",
  "4-22": "Earth Day",
  "7-4": "Independence Day",
  "10-31": "Halloween",
  "11-11": "Veterans Day",
  "12-25": "Christmas Day",
  "12-31": "New Year's Eve"
};

// Extracted Memoized Component to enforce absolute VDOM rendering stability on Year.
// This enforces the requirement: "The year (e.g., 2026) must remain stable and MUST NOT re-render unnecessarily."
const MemoizedYearDisplay = React.memo(({ year, isDarkMode }) => {
  return (
    <h2 className={`text-7xl sm:text-[6rem] lg:text-[7rem] font-black tracking-tighter mb-2 sm:mb-4 leading-none drop-shadow-[0_20px_20px_rgba(0,0,0,0.2)] ${isDarkMode ? 'text-white' : 'text-slate-900'} transition-colors duration-1000`}>
       {year}
    </h2>
  );
});

export default function WallCalendar() {
  // Refactored Top-Level Isolated States ensures flawless year stability
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);
  
  // Drag Selection Physics State
  const [isDragging, setIsDragging] = useState(false);
  const [dragOrigin, setDragOrigin] = useState(null);

  // Note Storage State
  const [notesStore, setNotesStore] = useState({});
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const storedTheme = localStorage.getItem('calendar_theme');
    if (storedTheme) return storedTheme === 'dark';
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true; // Default to dark cinematic
  });
  const [flipDirection, setFlipDirection] = useState('next');
  
  // Custom Dynamic Color State
  const [themeColor, setThemeColor] = useState([79, 70, 229]); // Default Indigo 
  const [isThemeLoading, setIsThemeLoading] = useState(false);
  const imgRef = useRef(null);

  // Mount dark mode via DOM root statically and sync to localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('calendar_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('calendar_theme', 'light');
    }
  }, [isDarkMode]);

  // Global Mouse Up for drag cancellation bounding box
  useEffect(() => {
    const handleGlobalMouseUp = () => {
       setIsDragging(false);
       setDragOrigin(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Load universal notes securely from localStorage identically
  useEffect(() => {
    try {
      const store = JSON.parse(localStorage.getItem('calendar_universal_notes') || '{}');
      setNotesStore(store);
    } catch (e) {
      setNotesStore({});
    }
  }, []);

  const formatDateString = useCallback((dateObj) => {
    return `${dateObj.getFullYear()}-${dateObj.getMonth()}-${dateObj.getDate()}`;
  }, []);

  // Smart Key Generation logically bound to year & month dependencies
  const activeNoteKey = useMemo(() => {
    if (selectionStart && selectionEnd) {
      return `range_${formatDateString(selectionStart)}_${formatDateString(selectionEnd)}`;
    }
    if (selectionStart) {
      return `date_${formatDateString(selectionStart)}`;
    }
    return `month_${year}_${month}`;
  }, [selectionStart, selectionEnd, year, month, formatDateString]);

  const activeNoteText = useMemo(() => notesStore[activeNoteKey] || '', [notesStore, activeNoteKey]);

  const activeNoteLabel = useMemo(() => {
    if (selectionStart && selectionEnd) return "Range Notes";
    if (selectionStart) return "Date Notes";
    return "Month Notes";
  }, [selectionStart, selectionEnd]);

  // Handle cross-matrix note mutations
  const handleActiveNoteChange = useCallback((e) => {
    const val = e.target.value;
    setNotesStore(prevStore => {
      const newStore = { ...prevStore, [activeNoteKey]: val };
      if (!val.trim()) delete newStore[activeNoteKey];
      localStorage.setItem('calendar_universal_notes', JSON.stringify(newStore));
      return newStore;
    });
  }, [activeNoteKey]);

  // Color Extraction Logic - runs securely using pure Canvas to avoid ESM package bloat
  const extractColors = useCallback(() => {
    if (!imgRef.current) return;
    try {
      const img = imgRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = 1;
      canvas.height = 1;
      
      ctx.drawImage(img, 0, 0, 1, 1);
      const data = ctx.getImageData(0, 0, 1, 1).data;
      
      let r = data[0], g = data[1], b = data[2];
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max > 0 && (max - min) < 60) {
        if (r === max) r = Math.min(255, r + 40);
        else if (g === max) g = Math.min(255, g + 40);
        else if (b === max) b = Math.min(255, b + 40);
      }
      
      setThemeColor([r, g, b]);
    } catch (e) {
      console.warn("Canvas cross-origin locked. Defaulting theme.", e);
      setThemeColor([79, 70, 229]);
    } finally {
      setIsThemeLoading(false);
    }
  }, []);

  const handleMouseDownOnDay = useCallback((day) => {
    if (!day) return;
    const clickedDate = new Date(year, month, day);
    clickedDate.setHours(0, 0, 0, 0);
    setDragOrigin(clickedDate);
    setIsDragging(true);
  }, [year, month]);

  const handleMouseEnterOnDay = useCallback((day) => {
    if (!day) return;
    setHoverDate(new Date(year, month, day));
    
    if (isDragging && dragOrigin) {
      const hoverD = new Date(year, month, day);
      hoverD.setHours(0, 0, 0, 0);
      const s = dragOrigin.getTime() < hoverD.getTime() ? dragOrigin : hoverD;
      const e = dragOrigin.getTime() < hoverD.getTime() ? hoverD : dragOrigin;
      setSelectionStart(s);
      setSelectionEnd(e);
    }
  }, [isDragging, dragOrigin, year, month]);

  const handleDateClick = useCallback((day, e) => {
    if (!day) return;
    const clickedDate = new Date(year, month, day);
    clickedDate.setHours(0, 0, 0, 0);

    // If attempting to build a range via hardware Shift key, honor it.
    if (e && e.shiftKey && selectionStart) {
       if (clickedDate.getTime() < selectionStart.getTime()) {
          setSelectionEnd(selectionStart);
          setSelectionStart(clickedDate);
       } else if (clickedDate.getTime() > selectionStart.getTime()) {
          setSelectionEnd(clickedDate);
       }
       return;
    }

    // Default Behavior: Select a solitary Day Date to view/write specific notes.
    // If clicking identical active day, clear down to month notes.
    if (selectionStart && !selectionEnd && clickedDate.getTime() === selectionStart.getTime()) {
      setSelectionStart(null);
    } else {
      setSelectionStart(clickedDate);
      setSelectionEnd(null);
    }
  }, [selectionStart, selectionEnd, year, month]);

  const handleMouseUpOnDay = useCallback((day, e) => {
    if (!day || !dragOrigin) return;
    const releaseD = new Date(year, month, day);
    releaseD.setHours(0, 0, 0, 0);
    
    if (dragOrigin.getTime() === releaseD.getTime()) {
      handleDateClick(day, e);
    }
    setDragOrigin(null);
    setIsDragging(false);
  }, [dragOrigin, year, month, handleDateClick]);

  // Clean, decoupled Month and Year Logic prevents year string DOM reattachment
  const nextMonth = useCallback(() => {
    setIsThemeLoading(true);
    setFlipDirection('next');
    if (month === 11) {
      setYear(y => y + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  }, [month]);

  const prevMonth = useCallback(() => {
    setIsThemeLoading(true);
    setFlipDirection('prev');
    if (month === 0) {
      setYear(y => y - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  }, [month]);

  // Memoized strictly, evaluating UI updates without bleeding memory
  const days = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const arr = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let i = 1; i <= daysInMonth; i++) arr.push(i);
    return arr;
  }, [year, month]);

  const isDateSelected = useCallback((day) => {
    if (!day) return false;
    const d = new Date(year, month, day).getTime();
    return (
        (selectionStart && d === selectionStart.getTime()) ||
        (selectionEnd && d === selectionEnd.getTime())
    );
  }, [selectionStart, selectionEnd, year, month]);

  const isDateInRange = useCallback((day) => {
    if (!day || !selectionStart || !selectionEnd) return false;
    const d = new Date(year, month, day).getTime();
    const s = selectionStart.getTime();
    const e = selectionEnd.getTime();
    return d > Math.min(s, e) && d < Math.max(s, e);
  }, [selectionStart, selectionEnd, year, month]);

  const isDateInHoverPreview = useCallback((day) => {
    if (!day || !selectionStart || selectionEnd || !hoverDate || isDragging) return false;
    const dTime = new Date(year, month, day).getTime();
    const sTime = selectionStart.getTime();
    const hTime = hoverDate.getTime();
    if (sTime < hTime) {
      return dTime > sTime && dTime <= hTime;
    } else if (sTime > hTime) {
      return dTime >= hTime && dTime < sTime;
    }
    return false;
  }, [selectionStart, selectionEnd, hoverDate, isDragging, year, month]);

  const currentMonthRangeKeys = useMemo(() => Object.keys(notesStore).filter(k => k.startsWith('range_') && notesStore[k].trim() !== ''), [notesStore]);
  
  const checkHasNote = useCallback((day) => {
    if (!day) return false;
    const dStr = `date_${year}-${month}-${day}`;
    if (notesStore[dStr] && notesStore[dStr].trim() !== '') return true;
    if (currentMonthRangeKeys.length > 0) {
      const dTime = new Date(year, month, day).getTime();
      for (const k of currentMonthRangeKeys) {
        const [sy, sm, sd, ey, em, ed] = k.replace('range_', '').split('_').flatMap(s => s.split('-')).map(Number);
        const stime = new Date(sy, sm, sd).getTime();
        const etime = new Date(ey, em, ed).getTime();
        if (dTime >= stime && dTime <= etime) return true;
      }
    }
    return false;
  }, [year, month, notesStore, currentMonthRangeKeys]);

  const activeImage = monthlyHeroImages[month];

  // Dynamic Accessibility Computation
  const [r, g, b] = themeColor;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const isThemeLight = luminance > 0.6;
  const accessibleTextOnTheme = isThemeLight ? '#020617' : '#ffffff'; 

  return (
    <div className={`relative transition-colors duration-1000 ease-in-out min-h-[100dvh] w-full flex items-center justify-center sm:p-6 md:p-10 lg:p-16 overflow-hidden ${isDarkMode ? 'text-slate-100 bg-slate-950' : 'text-slate-900 bg-slate-50'}`}>
      
      {/* CINEMATIC BACKGROUND LAYER WITH CROSS-FADE ARRAY LOGIC */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-slate-900">
        {monthlyHeroImages.map((imgSrc, index) => (
          <img 
            key={imgSrc}
            ref={index === month ? imgRef : null}
            src={imgSrc} 
            crossOrigin="anonymous"
            alt={`Cinematic Backdrop ${index}`} 
            onLoad={index === month ? extractColors : undefined}
            className={`absolute inset-0 object-cover w-full h-full transition-all duration-[2000ms] ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform ${!isDarkMode ? 'blur-xl' : ''}`}
            style={{
               opacity: index === month ? (isDarkMode ? 1 : 0.15) : 0,
               transform: index === month ? `scale(${isThemeLoading ? '1.05' : '1'})` : 'scale(1.1)',
               zIndex: index === month ? 10 : 0,
               pointerEvents: index === month ? 'auto' : 'none'
            }}
          />
        ))}

        <div className={`absolute inset-0 transition-colors duration-[1500ms] ease-[cubic-bezier(0.4,0,0.2,1)] z-20 pointer-events-none ${isDarkMode ? 'bg-black/60 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]' : 'bg-slate-50/70 border-b border-rose-50/10 shadow-[inset_0_0_50px_rgba(255,255,255,0.7)]'}`}></div>
        <div className={`absolute bottom-0 w-full h-1/3 bg-gradient-to-t z-20 pointer-events-none ${isDarkMode ? 'from-black/80 to-transparent' : 'from-white/50 to-transparent'}`}></div>
      </div>

      {/* GLASSMORPHIC HUD (CARD) - TINTED DYNAMICALLY WITH THE THEME COLOR */}
      <div 
        className={`relative z-30 w-full max-w-6xl mx-auto flex flex-col lg:flex-row overflow-hidden transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] 
        sm:rounded-[2.5rem] min-h-[100dvh] sm:min-h-auto backdrop-blur-3xl border
        ${isDarkMode ? 'shadow-[0_45px_70px_-15px_rgba(0,0,0,0.9)]' : 'shadow-[0_30px_80px_-15px_rgba(0,0,50,0.15)] ring-1 ring-white/60'}`}
        style={{
          backgroundColor: isDarkMode ? `rgba(${r}, ${g}, ${b}, 0.12)` : `rgba(255, 255, 255, 0.65)`,
          borderColor: isDarkMode ? `rgba(${r}, ${g}, ${b}, 0.3)` : `rgba(255, 255, 255, 0.8)`,
        }}
      >
        
        {/* Left Typography Hero */}
        <div className={`lg:w-5/12 p-8 sm:p-12 lg:p-16 flex flex-col justify-end lg:justify-center relative min-h-[250px] lg:min-h-auto border-b lg:border-b-0 lg:border-r ${isDarkMode ? 'border-white/10' : 'border-slate-800/5'}`}>
           <div className={`absolute inset-0 bg-gradient-to-tr opacity-20 pointer-events-none ${isDarkMode ? 'from-white/5 to-transparent' : 'from-indigo-600/5 to-transparent'}`}></div>
           
           <div className="relative z-10 select-none tracking-tight">
             {/* Year component is now formally isolated behind a strict React.memo boundary */}
             <MemoizedYearDisplay year={year} isDarkMode={isDarkMode} />

             {/* Only the month portion receives animation binding when keys update */}
             <div key={`month-hero-${month}`} className={`animate-flip-${flipDirection}`}>
               <div 
                  className="h-1.5 w-16 sm:w-24 rounded-full mb-6 sm:mb-8 transition-all duration-[600ms]" 
                  style={{ backgroundColor: isDarkMode ? `rgb(${r}, ${g}, ${b})` : `rgb(${r-30}, ${g-30}, ${b-30})`, opacity: isDarkMode ? 0.9 : 1.0 }} 
               />
               <p className={`text-4xl sm:text-5xl font-medium tracking-widest uppercase antialiased drop-shadow-sm ${isDarkMode ? 'text-white/90' : 'text-slate-800'}`}>
                  {monthNames[month]}
               </p>
             </div>
           </div>
        </div>

        {/* Right Interactive Calendar Section */}
        <div className="lg:w-7/12 p-4 py-8 sm:p-10 lg:p-14 flex flex-col flex-1 relative">
          
          {/* Header Controls */}
          <div className="flex justify-between items-center mb-8 sm:mb-12">
            <div className={`flex space-x-2 sm:space-x-4 items-center ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <button 
                onClick={prevMonth} 
                className={`group p-3 rounded-full transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.85] touch-manipulation focus-visible:outline-none focus-visible:ring-4 backdrop-blur-md ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5 hover:shadow-md'}`}
                style={{ 
                  backgroundColor: `rgba(${r}, ${g}, ${b}, ${isDarkMode ? 0.15 : 0.05})`,
                  borderColor: `rgba(${r}, ${g}, ${b}, 0.3)`,
                  boxShadow: isDarkMode ? `0 0 10px rgba(${r}, ${g}, ${b}, 0.1)` : 'none'
                }}
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              
              <div className="w-32 sm:w-56 overflow-hidden flex justify-center">
                <h1 key={`header-${month}`} className={`text-xl sm:text-3xl lg:text-4xl font-bold text-center tracking-tight leading-none drop-shadow-sm transition-colors animate-flip-${flipDirection}`} style={{ color: !isDarkMode ? `rgb(${Math.max(r-60,0)}, ${Math.max(g-60,0)}, ${Math.max(b-60,0)})` : 'inherit' }}>
                  {monthNames[month]}
                </h1>
              </div>
              
              <button 
                onClick={nextMonth} 
                className={`group p-3 rounded-full transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.85] touch-manipulation focus-visible:outline-none focus-visible:ring-4 backdrop-blur-md ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5 hover:shadow-md'}`}
                style={{ 
                  backgroundColor: `rgba(${r}, ${g}, ${b}, ${isDarkMode ? 0.15 : 0.05})`,
                  borderColor: `rgba(${r}, ${g}, ${b}, 0.3)`,
                  boxShadow: isDarkMode ? `0 0 10px rgba(${r}, ${g}, ${b}, 0.1)` : 'none'
                }}
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            {/* Premium Theme Toggle Colored with Selection */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className={`p-3 sm:p-3.5 rounded-full transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.85] touch-manipulation shadow-xl border backdrop-blur-xl focus-visible:outline-none focus-visible:ring-4
                ${isDarkMode ? 'text-white border-white/20 hover:scale-[1.10]' : 'bg-white text-yellow-500 border-white hover:bg-slate-50 hover:scale-[1.10] focus-visible:ring-slate-300 shadow-[0_15px_30px_rgba(0,0,40,0.15)]'}`}
              style={{ backgroundColor: isDarkMode ? `rgba(${r}, ${g}, ${b}, 0.5)` : 'white' }}
              title="Toggle Theme"
            >
              <div className="relative w-5 h-5 sm:w-6 sm:h-6 overflow-hidden">
                <div className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isDarkMode ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full opacity-0 scale-50'}`}>
                  <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                </div>
                <div className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isDarkMode ? '-translate-y-full opacity-0 scale-50' : 'translate-y-0 opacity-100 scale-100'}`}>
                  <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 2.32a1 1 0 011.415 0l.707.707a1 1 0 01-1.414 1.415l-.707-.707a1 1 0 010-1.415zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zm-2.32 4.22a1 1 0 010 1.415l-.707.707a1 1 0 01-1.415-1.414l.707-.707a1 1 0 011.415 0zM10 18a1 1 0 01-1-1v-1a1 1 0 112 0v1a1 1 0 01-1 1zm-4.22-2.32a1 1 0 01-1.415 0l-.707-.707a1 1 0 011.414-1.415l.707.707a1 1 0 010 1.415zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zm2.32-4.22a1 1 0 010-1.415l.707-.707a1 1 0 011.415 1.414l-.707.707a1 1 0 01-1.415 0zM10 4a6 6 0 100 12 6 6 0 000-12z" clipRule="evenodd" /></svg>
                </div>
              </div>
            </button>
          </div>

          {/* Calendar Grid */}
          <div 
             key={`grid-${month}`} 
             className={`grid grid-cols-7 gap-y-3 sm:gap-y-5 gap-x-1 sm:gap-x-2 mb-8 sm:mb-10 animate-flip-${flipDirection} touch-none select-none`}
             onMouseLeave={() => setHoverDate(null)}
          >
            {dayNames.map((day, idx) => (
              <div 
                key={day} 
                className="text-center text-[10px] sm:text-xs md:text-sm font-bold tracking-widest uppercase mb-2"
                style={{
                   color: (idx === 0 || idx === 6) ? `rgb(${Math.min(r+100, 255)}, ${Math.max(g-50, 0)}, ${Math.max(b-50, 0)})` : (isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)')
                }}
              >
                {day.substring(0, 3)}
              </div>
            ))}
            
            {days.map((day, index) => {
              const isWeekend = (index % 7 === 0) || (index % 7 === 6);
              const holidayName = commonHolidays[`${month + 1}-${day}`];
              const selected = isDateSelected(day);
              const inRange = isDateInRange(day);
              const hoverPreview = isDateInHoverPreview(day);
              const dayHasNote = checkHasNote(day);
              
              const baseClasses = "relative flex items-center justify-center text-sm sm:text-base md:text-lg font-semibold transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer select-none outline-none focus-visible:ring-4";
              let structuralClasses = "h-10 w-10 sm:h-12 sm:w-12 mx-auto rounded-full backdrop-blur-sm lg:backdrop-blur-none "; 
              
              let inlineStyle = {};

              if (!day) return <div key={`empty-${index}`}></div>;

              if (selected) {
                 inlineStyle = {
                    backgroundColor: `rgb(${r}, ${g}, ${b})`,
                    color: accessibleTextOnTheme,
                    boxShadow: isDarkMode ? `0 0 25px rgba(${r}, ${g}, ${b}, 0.7)` : `0 10px 25px rgba(${r}, ${g}, ${b}, 0.4)`,
                    border: `2px solid rgba(255,255,255,0.4)`
                 };
                 structuralClasses += " scale-110 z-10 font-bold ";
              } else if (inRange) {
                 inlineStyle = {
                    backgroundColor: `rgba(${r}, ${g}, ${b}, ${isDarkMode ? 0.3 : 0.15})`,
                    color: isDarkMode ? '#e2e8f0' : `rgb(${Math.max(r-100,0)}, ${Math.max(g-100,0)}, ${Math.max(b-100,0)})`,
                    border: `1px solid rgba(${r}, ${g}, ${b}, 0.2)`
                 };
              } else if (hoverPreview) {
                 inlineStyle = {
                    backgroundColor: `rgba(${r}, ${g}, ${b}, ${isDarkMode ? 0.15 : 0.08})`,
                    color: isDarkMode ? '#cbd5e1' : `rgb(${Math.max(r-100,0)}, ${Math.max(g-100,0)}, ${Math.max(b-100,0)})`,
                    border: `1px dashed rgba(${r}, ${g}, ${b}, 0.5)`
                 };
              } else {
                 if (holidayName) {
                   inlineStyle = {
                      backgroundColor: `rgba(245, 158, 11, ${isDarkMode ? 0.08 : 0.05})`,
                      color: isDarkMode ? '#fcd34d' : '#b45309',
                      border: `1px solid rgba(245, 158, 11, 0.15)`
                   };
                 } else if (isWeekend) {
                   inlineStyle = {
                      backgroundColor: `rgba(244, 63, 94, ${isDarkMode ? 0.08 : 0.05})`,
                      color: isDarkMode ? '#fda4af' : '#be123c',
                      border: `1px solid rgba(244, 63, 94, 0.15)`
                   };
                 } else {
                   inlineStyle = {
                      color: isDarkMode ? '#f8fafc' : '#1e293b'
                   };
                 }
                 structuralClasses += " hover:bg-white/10 hover:border-white/40 active:scale-[0.80] lg:hover:scale-[1.20] lg:opacity-90 hover:opacity-100 border border-transparent hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] bg-transparent";
              }

              return (
                <div key={index} className="flex justify-center items-center relative">
                  <button
                    onMouseDown={() => handleMouseDownOnDay(day)}
                    onMouseEnter={() => handleMouseEnterOnDay(day)}
                    onMouseUp={(e) => handleMouseUpOnDay(day, e)}
                    onClick={(e) => { if(!isDragging) handleDateClick(day, e); }}
                    className={`${baseClasses} ${structuralClasses}`}
                    style={inlineStyle}
                    aria-pressed={selected}
                    title={holidayName || ""}
                  >
                    {day}
                    
                    {holidayName && !selected && !inRange && (
                       <div className="absolute top-1 sm:top-1.5 left-1/2 transform -translate-x-1/2 w-3 h-[2px] sm:w-4 rounded-full bg-amber-500/30"></div>
                    )}
                    
                    {/* Visual dot indicator for stored notes */}
                    {dayHasNote && (
                        <div 
                          className="absolute bottom-1 sm:bottom-1.5 left-1/2 transform -translate-x-1/2 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)] transition-all duration-300"
                          style={{ 
                            backgroundColor: selected ? accessibleTextOnTheme : (isDarkMode ? 'rgba(255,255,255,0.9)' : `rgb(${r}, ${g}, ${b})`) 
                          }}
                        />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Cinematic Premium Notes Section tied into dynamic theme palette */}
          <div className="mt-auto flex-1 flex flex-col group min-h-[140px] sm:min-h-[180px]">
            <div 
              className={`flex flex-col h-full rounded-[1.5rem] p-5 sm:p-6 border transition-all duration-[600ms] ease-out touch-pan-y focus-within:ring-2 focus-within:ring-offset-2 ${isDarkMode ? 'shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)] focus-within:ring-white/30' : 'shadow-[inset_0_2px_15px_rgba(255,255,255,1)] focus-within:ring-slate-300 focus-within:ring-offset-slate-50 bg-white/40'}`}
              style={{
                 backgroundColor: isDarkMode ? `rgba(0, 0, 0, 0.3)` : `rgba(255, 255, 255, 0.5)`,
                 borderColor: `rgba(${r}, ${g}, ${b}, 0.3)`
              }}
            >
              
              <label 
                className={`text-xs sm:text-[13px] font-bold mb-3 sm:mb-4 flex items-center uppercase tracking-widest transition-colors duration-300 ${isDarkMode ? '' : 'group-focus-within:text-slate-900 drop-shadow-sm'}`}
                style={{ color: isDarkMode ? `rgba(${r+50}, ${g+50}, ${b+50}, 0.8)` : `rgb(${Math.max(r-40,0)}, ${Math.max(g-40,0)}, ${Math.max(b-40,0)})` }}
               >
                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 mr-2.5 transition-transform duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-focus-within:scale-[1.25]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                {activeNoteLabel}
              </label>
              
              <textarea
                value={activeNoteText}
                onChange={handleActiveNoteChange}
                placeholder="Log notes, goals, or milestones..."
                className={`w-full flex-1 resize-none bg-transparent outline-none transition-all duration-[400ms] ease-in-out font-medium leading-relaxed rounded-xl text-[15px] sm:text-lg p-1 sm:p-0 
                  ${isDarkMode ? 'text-white/90 placeholder-white/30 selection:bg-white/30' : 'text-slate-800 placeholder-slate-400 selection:bg-indigo-300/40'} focus:ring-0`}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
