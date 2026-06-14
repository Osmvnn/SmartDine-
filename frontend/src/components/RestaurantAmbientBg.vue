<template>
  <div class="ambient-bg" aria-hidden="true">
    <div class="ambient-glow glow-1"></div>
    <div class="ambient-glow glow-2"></div>

    <svg class="ambient-art" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <!-- plate, top right -->
      <circle cx="840" cy="170" r="170" stroke="rgba(246,193,119,0.10)" stroke-width="2" fill="none" />
      <circle cx="840" cy="170" r="125" stroke="rgba(246,193,119,0.14)" stroke-width="2" fill="none" />
      <circle cx="840" cy="170" r="2" fill="rgba(246,193,119,0.18)" />

      <!-- fork, left side -->
      <g stroke="rgba(246,193,119,0.12)" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <line x1="90" y1="60" x2="90" y2="340" />
        <path d="M70 60 L70 130 Q70 150 90 150 Q110 150 110 130 L110 60" />
        <line x1="90" y1="60" x2="90" y2="120" />
      </g>

      <!-- knife, left side -->
      <g stroke="rgba(45,143,123,0.12)" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <line x1="160" y1="60" x2="160" y2="340" />
        <path d="M160 60 Q190 90 160 160" />
      </g>

      <!-- steam wisps above a cup, bottom right -->
      <g stroke="rgba(255,247,237,0.14)" stroke-width="4" fill="none" stroke-linecap="round">
        <path d="M760 760 Q745 720 765 690 Q785 660 770 620" />
        <path d="M820 770 Q805 730 825 700 Q845 670 830 630" />
        <path d="M880 760 Q865 720 885 690 Q905 660 890 620" />
      </g>

      <!-- cup, bottom right -->
      <g stroke="rgba(45,143,123,0.14)" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M730 800 L890 800 L875 880 Q872 900 850 900 L770 900 Q748 900 745 880 Z" />
        <path d="M890 815 Q930 815 930 845 Q930 875 890 870" />
      </g>

      <!-- herb sprig, bottom left -->
      <g stroke="rgba(45,143,123,0.14)" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M60 980 Q90 900 150 860" />
        <path d="M95 935 Q70 920 55 930" />
        <path d="M115 905 Q90 890 75 900" />
        <path d="M135 875 Q112 860 95 868" />
      </g>

      <!-- scattered dots for texture -->
      <g fill="rgba(246,193,119,0.12)">
        <circle cx="480" cy="80" r="3" />
        <circle cx="540" cy="140" r="2" />
        <circle cx="430" cy="180" r="2" />
        <circle cx="300" cy="900" r="3" />
        <circle cx="360" cy="950" r="2" />
        <circle cx="950" cy="450" r="2" />
        <circle cx="980" cy="380" r="3" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.ambient-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.ambient-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
}

.glow-1 {
  width: 480px;
  height: 480px;
  top: -160px;
  right: -120px;
  background: radial-gradient(circle, rgba(200, 121, 42, 0.22), transparent 70%);
}

.glow-2 {
  width: 420px;
  height: 420px;
  bottom: -140px;
  left: -100px;
  background: radial-gradient(circle, rgba(45, 143, 123, 0.18), transparent 70%);
}

.ambient-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
