import React, { useEffect } from 'react';

export default function WeglotWidgetMobile() {
  useEffect(() => {
    if (!document.getElementById('weglot-script')) {
      const script = document.createElement('script');
      script.id = 'weglot-script';
      script.src = 'https://cdn.weglot.com/weglot.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="weglot-mobile fixed top-16 right-4 z-50 lg:hidden">
      <div id="weglot-container" />
    </div>
  );
}
