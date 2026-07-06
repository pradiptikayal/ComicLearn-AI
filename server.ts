import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent header as required by AI Studio guidelines
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("Gemini API initialized successfully.");
} else {
  console.warn("GEMINI_API_KEY environment variable is missing or placeholder. Running in dynamic local demo mode.");
}

// 1. Dynamic Comic Creator Fallback (Local fallback when API key is missing or fails)
function generateComicPanelSvg(character: string, topic: string, panelNum: number, concept: string, dialogue: string): string {
  const char = character.toLowerCase();
  let primaryColor = "#000000";
  let secondaryColor = "#EFF6FF"; // Soft blue
  let accentColor = "#FFDE59"; // Yellow default
  let charEmoji = "✨";
  let charTag = "WOW!";

  if (char.includes("sherlock")) {
    primaryColor = "#000000";
    secondaryColor = "#FEF3C7"; // Cozy cream/amber
    accentColor = "#F59E0B";
    charEmoji = "🕵️‍♂️";
    charTag = "AHA!";
  } else if (char.includes("einstein")) {
    primaryColor = "#000000";
    secondaryColor = "#FAF5FF"; // Lavender
    accentColor = "#A855F7";
    charEmoji = "🧠";
    charTag = "EUREKA!";
  } else if (char.includes("iron")) {
    primaryColor = "#000000";
    secondaryColor = "#FEF2F2"; // Rose
    accentColor = "#EF4444";
    charEmoji = "🚀";
    charTag = "WHOOSH!";
  } else if (char.includes("batman")) {
    primaryColor = "#000000";
    secondaryColor = "#F1F5F9"; // Cool slate
    accentColor = "#E2E8F0";
    charEmoji = "🦇";
    charTag = "BAM!";
  }

  // Generate gorgeous educational visual details depending on panel number (narrative stages)
  let conceptDraw = "";
  if (panelNum === 1) {
    // THE HOOK: The discovery/mystery
    conceptDraw = `
      <!-- Decorative Study Room details -->
      <path d="M 40,360 L 520,360" stroke="#000000" stroke-width="4" stroke-dasharray="5,5" />
      <!-- Table with books -->
      <rect x="60" y="310" width="150" height="50" fill="#78350F" stroke="#000000" stroke-width="4" />
      <rect x="80" y="270" width="100" height="40" fill="#93C5FD" stroke="#000000" stroke-width="3" rx="5" />
      <text x="130" y="295" font-family="'Inter', sans-serif" font-weight="900" font-size="10" fill="#1E3A8A">TOPIC NOTES</text>
      
      <!-- Hologram clue/mystery box -->
      <g transform="translate(320, 220)">
        <polygon points="0,-40 35,-20 35,20 0,40 -35,20 -35,-20" fill="#FDE047" stroke="#000000" stroke-width="4" opacity="0.9" />
        <text x="0" y="8" font-family="'Inter', sans-serif" font-weight="900" font-size="28" fill="#000000" text-anchor="middle">?</text>
        <!-- Sparkle lines radiating -->
        <line x1="-50" y1="-50" x2="-35" y2="-35" stroke="#FBBF24" stroke-width="3" />
        <line x1="50" y1="-50" x2="35" y2="-35" stroke="#FBBF24" stroke-width="3" />
        <line x1="-50" y1="50" x2="-35" y2="35" stroke="#FBBF24" stroke-width="3" />
        <line x1="50" y1="50" x2="35" y2="35" stroke="#FBBF24" stroke-width="3" />
      </g>
      
      <!-- Label plaque style -->
      <g transform="translate(200, 110) rotate(-2)">
        <rect x="-100" y="-15" width="200" height="30" fill="#FFD23F" stroke="#000000" stroke-width="3" />
        <text x="0" y="5" font-family="'Inter', sans-serif" font-weight="900" font-size="11" fill="#000000" text-anchor="middle" letter-spacing="1">THE HOOK MYSTERY</text>
      </g>
    `;
  } else if (panelNum === 2) {
    // THE MECHANISM: Abstract micro-world landscape
    conceptDraw = `
      <!-- Rainbow backdrop representing orchestration -->
      <path d="M 50,300 Q 250,50 450,300" fill="none" stroke="#EF4444" stroke-width="8" opacity="0.6" />
      <path d="M 70,300 Q 250,75 430,300" fill="none" stroke="#FBBF24" stroke-width="8" opacity="0.6" />
      <path d="M 90,300 Q 250,100 410,300" fill="none" stroke="#3B82F6" stroke-width="8" opacity="0.6" />
      
      <!-- Dynamic Gears representing logic -->
      <g transform="translate(180, 180) rotate(20)">
        <circle cx="0" cy="0" r="45" fill="#CBD5E1" stroke="#000000" stroke-width="4" />
        <rect x="-10" y="-55" width="20" height="110" fill="#94A3B8" stroke="#000000" stroke-width="3" />
        <rect x="-55" y="-10" width="110" height="20" fill="#94A3B8" stroke="#000000" stroke-width="3" />
        <circle cx="0" cy="0" r="15" fill="#F1F5F9" stroke="#000000" stroke-width="3" />
      </g>
      <g transform="translate(290, 240) rotate(-15)">
        <circle cx="0" cy="0" r="30" fill="#FFD23F" stroke="#000000" stroke-width="4" />
        <rect x="-7" y="-38" width="14" height="76" fill="#FBBF24" stroke="#000000" stroke-width="3" />
        <rect x="-38" y="-7" width="76" height="14" fill="#FBBF24" stroke="#000000" stroke-width="3" />
        <circle cx="0" cy="0" r="10" fill="#FFFBEB" stroke="#000000" stroke-width="3" />
      </g>

      <path d="M 180,180 Q 240,120 290,240" fill="none" stroke="#000000" stroke-width="3" stroke-dasharray="6,6" />
      
      <!-- Flying particles -->
      <circle cx="210" cy="140" r="6" fill="#EF4444" />
      <circle cx="250" cy="160" r="8" fill="#10B981" />
      <circle cx="160" cy="220" r="5" fill="#3B82F6" />
      
      <!-- Label -->
      <g transform="translate(260, 90) rotate(1.5)">
        <rect x="-90" y="-15" width="180" height="30" fill="#38BDF8" stroke="#000000" stroke-width="3" />
        <text x="0" y="5" font-family="'Inter', sans-serif" font-weight="900" font-size="10" fill="#000000" text-anchor="middle" letter-spacing="1">THE MECHANISM</text>
      </g>
    `;
  } else if (panelNum === 3) {
    // THE RESULT: Mastering the machine
    conceptDraw = `
      <!-- High-tech master machine panel -->
      <rect x="60" y="160" width="380" height="200" fill="#1E293B" stroke="#000000" stroke-width="4" rx="10" />
      <!-- Glowing grid interface -->
      <rect x="80" y="180" width="180" height="120" fill="#0F172A" stroke="#000000" stroke-width="3" />
      <!-- Grid lines -->
      <line x1="80" y1="210" x2="260" y2="210" stroke="#334155" stroke-width="1" />
      <line x1="80" y1="240" x2="260" y2="240" stroke="#334155" stroke-width="1" />
      <line x1="80" y1="270" x2="260" y2="270" stroke="#334155" stroke-width="1" />
      <line x1="125" y1="180" x2="125" y2="300" stroke="#334155" stroke-width="1" />
      <line x1="170" y1="180" x2="170" y2="300" stroke="#334155" stroke-width="1" />
      <line x1="215" y1="180" x2="215" y2="300" stroke="#334155" stroke-width="1" />
      
      <path d="M 90,280 Q 140,200 180,250 T 250,190" fill="none" stroke="#22D3EE" stroke-width="4" />
      
      <!-- Heavy physical toggle lever switches -->
      <g transform="translate(320, 240)">
        <rect x="-40" y="-40" width="80" height="80" fill="#475569" stroke="#000000" stroke-width="3" />
        <line x1="0" y1="20" x2="15" y2="-45" stroke="#B91C1C" stroke-width="8" stroke-linecap="round" />
        <line x1="0" y1="20" x2="15" y2="-45" stroke="#000000" stroke-width="12" stroke-linecap="round" z-index="-1" />
        <circle cx="15" cy="-45" r="12" fill="#EF4444" stroke="#000000" stroke-width="3" />
        <text x="0" y="32" font-family="'Inter', sans-serif" font-weight="900" font-size="9" fill="#FFFFFF" text-anchor="middle">GEMINI ON</text>
      </g>
      
      <!-- Glowing core cube -->
      <g transform="translate(230, 140) scale(0.8)">
        <polygon points="0,-30 25,-15 25,15 0,30 -25,15 -25,-15" fill="#22D3EE" stroke="#000000" stroke-width="3" opacity="0.9" />
        <polygon points="0,-30 25,-15 0,0 -25,-15" fill="#E0F2FE" stroke="#000000" stroke-width="2" />
        <line x1="0" y1="0" x2="0" y2="30" stroke="#000000" stroke-width="2" />
      </g>
    `;
  } else {
    // THE SYNOPSIS: Real-world application
    conceptDraw = `
      <!-- Beautiful hand-drawn Android Phone device -->
      <g transform="translate(140, 150) rotate(-4)">
        <rect x="0" y="0" width="140" height="240" rx="18" fill="#1E293B" stroke="#000000" stroke-width="5" />
        <rect x="8" y="12" width="124" height="216" rx="10" fill="#ECFDF5" />
        <circle cx="70" cy="22" r="4" fill="#000000" />
        
        <!-- App content mock-up -->
        <rect x="16" y="32" width="108" height="24" fill="#10B981" rx="4" />
        <text x="70" y="47" font-family="'Inter', sans-serif" font-weight="900" font-size="8" fill="#FFFFFF" text-anchor="middle">COMICLEARN AI</text>
        
        <circle cx="70" cy="100" r="28" fill="#FDE047" stroke="#000000" stroke-width="2" />
        <text x="70" y="104" font-size="20" text-anchor="middle">🏆</text>
        
        <rect x="22" y="145" width="96" height="12" fill="#3B82F6" rx="2" />
        <rect x="22" y="165" width="96" height="12" fill="#6B7280" rx="2" />
        <text x="70" y="154" font-family="'Inter', sans-serif" font-weight="900" font-size="6" fill="#FFFFFF" text-anchor="middle">LESSON SUCCESS!</text>
      </g>
      
      <!-- Completed report document -->
      <g transform="translate(340, 220) rotate(6)">
        <rect x="0" y="0" width="90" height="120" fill="#FFFFFF" stroke="#000000" stroke-width="4" />
        <line x1="15" y1="25" x2="75" y2="25" stroke="#000000" stroke-width="3" />
        <line x1="15" y1="45" x2="75" y2="45" stroke="#475569" stroke-width="2" />
        <line x1="15" y1="65" x2="60" y2="65" stroke="#475569" stroke-width="2" />
        <line x1="15" y1="85" x2="70" y2="85" stroke="#10B981" stroke-width="3" />
        <path d="M 75,95 L 80,105 L 70,105 Z" fill="#EF4444" stroke="#000000" stroke-width="1.5" />
      </g>
      
      <path d="M 60,110 L 80,130 L 65,140 L 50,120 Z" fill="#FBBF24" opacity="0.4" />
      <path d="M 410,130 L 430,150 L 415,160 Z" fill="#FBBF24" opacity="0.4" />
    `;
  }

  // Draw customized hand-drawn characters
  let charDraw = "";
  if (char.includes("sherlock")) {
    charDraw = `
      <!-- Sherlock Deerstalker Cap -->
      <path d="M 600,200 C 600,140 700,140 700,200 Z" fill="#7C5D43" stroke="#000000" stroke-width="4" />
      <path d="M 585,200 L 715,200 L 705,210 L 595,210 Z" fill="#5C4033" stroke="#000000" stroke-width="4" />
      <path d="M 640,145 C 650,135 650,135 660,145 Z" fill="#C2410C" stroke="#000000" stroke-width="3" />
      
      <!-- Ear Flap -->
      <path d="M 630,200 L 670,200 L 660,230 L 640,230 Z" fill="#5C4033" stroke="#000000" stroke-width="3" />
      
      <!-- Face -->
      <circle cx="650" cy="245" r="35" fill="#FED7AA" stroke="#000000" stroke-width="4" />
      <ellipse cx="638" cy="240" rx="4" ry="6" fill="#000000" />
      <ellipse cx="662" cy="240" rx="4" ry="6" fill="#000000" />
      <path d="M 640,260 Q 650,270 660,260" stroke="#000000" stroke-width="4" fill="none" stroke-linecap="round" />
      
      <!-- Pipe smoke -->
      <path d="M 665,260 Q 685,265 690,250 L 695,250 L 690,265 Q 680,275 665,260 Z" fill="#7C5D43" stroke="#000000" stroke-width="2" />
      <circle cx="692" cy="248" r="6" fill="#EA580C" stroke="#000000" stroke-width="2" />
      <circle cx="700" cy="230" r="8" fill="#E2E8F0" opacity="0.6" />
      <circle cx="715" cy="220" r="12" fill="#E2E8F0" opacity="0.4" />

      <!-- Magnifying glass -->
      <g transform="translate(520, 260) rotate(-10)">
        <line x1="0" y1="0" x2="35" y2="45" stroke="#7C5D43" stroke-width="10" stroke-linecap="round" />
        <line x1="0" y1="0" x2="35" y2="45" stroke="#000000" stroke-width="14" stroke-linecap="round" z-index="-1" />
        <circle cx="0" cy="0" r="30" fill="#E0F2FE" fill-opacity="0.7" stroke="#000000" stroke-width="6" />
        <circle cx="0" cy="0" r="30" fill="none" stroke="#38BDF8" stroke-width="3" stroke-dasharray="10,5" />
        <path d="M -15,-15 Q -5,-25 10,-15" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" fill="none" />
      </g>
    `;
  } else if (char.includes("einstein")) {
    charDraw = `
      <!-- Wild hair -->
      <path d="M 590,240 C 560,220 570,170 600,160 C 610,130 650,120 670,140 C 700,120 730,140 730,170 C 750,190 740,230 710,250 C 730,270 720,310 690,300 C 670,320 630,320 610,290 C 580,300 570,260 590,240 Z" fill="#F1F5F9" stroke="#94A3B8" stroke-width="3" />
      <path d="M 590,240 C 560,220 570,170 600,160 C 610,130 650,120 670,140 C 700,120 730,140 730,170 C 750,190 740,230 710,250 C 730,270 720,310 690,300 C 670,320 630,320 610,290 C 580,300 570,260 590,240 Z" fill="none" stroke="#000000" stroke-width="4" />
      
      <!-- Face -->
      <circle cx="650" cy="235" r="35" fill="#FED7AA" stroke="#000000" stroke-width="4" />
      
      <!-- Mustache & Eyebrows -->
      <path d="M 625,215 Q 635,210 645,215" stroke="#475569" stroke-width="4" fill="none" />
      <path d="M 655,215 Q 665,210 675,215" stroke="#475569" stroke-width="4" fill="none" />
      <path d="M 630,255 Q 650,240 670,255 Q 685,265 670,270 Q 650,260 630,270 Q 615,265 630,255 Z" fill="#E2E8F0" stroke="#000000" stroke-width="3" />

      <!-- Eyes & Tongue -->
      <ellipse cx="638" cy="228" rx="4" ry="5" fill="#000000" />
      <ellipse cx="662" cy="228" rx="4" ry="5" fill="#000000" />
      <path d="M 645,262 C 645,275 655,275 655,262 Z" fill="#EF4444" stroke="#000000" stroke-width="2" />
    `;
  } else if (char.includes("iron")) {
    charDraw = `
      <!-- Red/Gold Armor shoulders -->
      <path d="M 590,310 L 710,310 L 730,360 L 570,360 Z" fill="#B91C1C" stroke="#000000" stroke-width="4" />
      <circle cx="650" cy="350" r="16" fill="#E0F2FE" stroke="#000000" stroke-width="3" />
      <circle cx="650" cy="350" r="10" fill="#FFFFFF" />

      <!-- Helmet -->
      <rect x="610" y="190" width="80" height="90" rx="20" fill="#B91C1C" stroke="#000000" stroke-width="4" />
      <path d="M 620,210 L 680,210 L 675,275 L 650,285 L 625,275 Z" fill="#FBBF24" stroke="#000000" stroke-width="3" />
      <!-- Glowing cyan eyes -->
      <polygon points="628,230 644,230 642,238 630,238" fill="#22D3EE" stroke="#000000" stroke-width="2" />
      <polygon points="672,230 656,230 658,238 670,238" fill="#22D3EE" stroke="#000000" stroke-width="2" />
    `;
  } else if (char.includes("batman")) {
    charDraw = `
      <!-- Dark Cape -->
      <path d="M 570,310 Q 650,300 730,310 L 750,365 L 550,365 Z" fill="#1E293B" stroke="#000000" stroke-width="4" />
      
      <!-- Cowl Mask -->
      <rect x="615" y="195" width="70" height="85" rx="15" fill="#1E293B" stroke="#000000" stroke-width="4" />
      <polygon points="615,200 620,150 635,195" fill="#1E293B" stroke="#000000" stroke-width="3" />
      <polygon points="685,200 680,150 665,195" fill="#1E293B" stroke="#000000" stroke-width="3" />
      <polygon points="626,224 642,226 638,232 628,230" fill="#FFFFFF" stroke="#000000" stroke-width="2" />
      <polygon points="674,224 658,226 662,232 672,230" fill="#FFFFFF" stroke="#000000" stroke-width="2" />
      <path d="M 632,255 L 668,255 L 660,275 L 640,275 Z" fill="#FED7AA" stroke="#000000" stroke-width="2" />
      <path d="M 638,264 Q 650,258 662,264" stroke="#000000" stroke-width="2.5" fill="none" />
    `;
  } else {
    // Default Cute robot
    charDraw = `
      <rect x="590" y="295" width="120" height="70" rx="10" fill="#38BDF8" stroke="#000000" stroke-width="4" />
      <circle cx="650" cy="330" r="15" fill="#FFD23F" stroke="#000000" stroke-width="3" />
      
      <rect x="615" y="210" width="70" height="60" rx="15" fill="#0EA5E9" stroke="#000000" stroke-width="4" />
      <rect x="625" y="222" width="50" height="24" rx="8" fill="#0F172A" stroke="#000000" stroke-width="2" />
      <circle cx="640" cy="234" r="4" fill="#34D399" />
      <circle cx="660" cy="234" r="4" fill="#34D399" />
      <line x1="650" y1="210" x2="650" y2="185" stroke="#000000" stroke-width="4" />
      <circle cx="650" cy="180" r="8" fill="#EF4444" stroke="#000000" stroke-width="2" />
    `;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
      <defs>
        <!-- Hand-drawn line displacement filter -->
        <filter id="sketchy" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        <!-- Watercolor paper texture filter -->
        <filter id="paper-texture" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="4" result="noise" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.12 0" />
          <feBlend mode="multiply" in="SourceGraphic" in2="noise" />
        </filter>

        <linearGradient id="watercolorGrad-${panelNum}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${secondaryColor}" />
          <stop offset="60%" stop-color="${secondaryColor}" stop-opacity="0.85" />
          <stop offset="100%" stop-color="#FFFBEB" />
        </linearGradient>
      </defs>

      <!-- Panel background wash with watercolor paper texture -->
      <rect width="800" height="600" fill="url(#watercolorGrad-${panelNum})" />
      <rect width="800" height="600" fill="url(#watercolorGrad-${panelNum})" filter="url(#paper-texture)" />

      <!-- Cozy sketchy comic grid borders -->
      <rect x="15" y="15" width="770" height="570" fill="none" stroke="#000000" stroke-width="8" filter="url(#sketchy)" />

      <!-- Radiating action lines -->
      <g stroke="#000000" stroke-width="1.5" opacity="0.12" stroke-dasharray="10,8">
        <line x1="400" y1="300" x2="0" y2="0" />
        <line x1="400" y1="300" x2="800" y2="0" />
        <line x1="400" y1="300" x2="0" y2="600" />
        <line x1="400" y1="300" x2="800" y2="600" />
        <line x1="400" y1="300" x2="400" y2="0" />
        <line x1="400" y1="300" x2="400" y2="600" />
        <line x1="400" y1="300" x2="0" y2="300" />
        <line x1="400" y1="300" x2="800" y2="300" />
      </g>

      <!-- Educational Topic Header plaque - gorgeous sketchy hand-drawn block -->
      <g transform="translate(400, 55) rotate(-1)" filter="url(#sketchy)">
        <rect x="-180" y="-20" width="360" height="40" fill="#FFFFFF" stroke="#000000" stroke-width="4" />
        <rect x="-184" y="-24" width="368" height="48" fill="none" stroke="#000000" stroke-width="2" opacity="0.5" />
        <text x="0" y="7" font-family="'Space Grotesk', 'Inter', sans-serif" font-weight="900" font-size="14" fill="#000000" text-anchor="middle" letter-spacing="2">
          ${topic.toUpperCase()}
        </text>
      </g>

      <!-- Educational concept visualizer graphics based on narrative stage -->
      <g filter="url(#sketchy)">
        ${conceptDraw}
      </g>

      <!-- Character drawings -->
      <g filter="url(#sketchy)">
        ${charDraw}
      </g>

      <!-- Interactive Comic speech bubble using foreignObject for flawless text wrapping -->
      <g transform="translate(0, 0)">
        <foreignObject x="45" y="425" width="710" height="120" filter="url(#sketchy)">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Space Grotesk', 'Inter', sans-serif; font-size: 15px; font-weight: 800; color: #0D1B2A; line-height: 1.45; text-align: left; display: flex; align-items: center; justify-content: flex-start; height: 100%; padding: 18px 28px; background-color: #FFFDF0; border: 4px solid #000000; border-radius: 24px; box-shadow: 6px 6px 0px #000000; position: relative; box-sizing: border-box;">
            <div style="flex: 1; padding-right: 20px;">
              <span style="color: #FF4D4D; text-transform: uppercase; font-size: 11px; font-weight: 900; letter-spacing: 1.5px; display: block; margin-bottom: 4px;">
                ${character.toUpperCase()} SAYS:
              </span>
              "${dialogue}"
            </div>
            <!-- Speech Bubble Tail pointing back up to the character face on the right -->
            <div style="position: absolute; top: -18px; right: 90px; width: 0; height: 0; border-left: 15px solid transparent; border-right: 15px solid transparent; border-bottom: 18px solid #000000;"></div>
            <div style="position: absolute; top: -12px; right: 90px; width: 0; height: 0; border-left: 15px solid transparent; border-right: 15px solid transparent; border-bottom: 18px solid #FFFDF0;"></div>
          </div>
        </foreignObject>
      </g>

    </svg>
  `.trim();

  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

function generateDemoComic(topic: string, character: string, followUp?: string): any {
  const formattedTopic = topic.trim();
  const capTopic = formattedTopic.charAt(0).toUpperCase() + formattedTopic.slice(1);
  const capChar = character.charAt(0).toUpperCase() + character.slice(1);

  let assetList: any[] = [];

  if (followUp) {
    const panelsData = [
      {
        panel_number: 1,
        narrative_stage: "Introduction",
        concept: `${capChar} holds up a glowing holographic schematic of ${formattedTopic} to answer your question: "${followUp}"`,
        dialogue: `Ah! Excellent follow-up! You asked: "${followUp}". Let's dive deeper! Here is how we see this closely.`
      },
      {
        panel_number: 2,
        narrative_stage: "Core Mechanism",
        concept: `${capChar} points excitedly at a magnifying glass showing microscopic reactions and action effects`,
        dialogue: `See here? When we zoom in, the core elements of ${formattedTopic} begin to react and organize themselves!`
      },
      {
        panel_number: 3,
        narrative_stage: "Development",
        concept: `${capChar} performs a fun experiment on a laboratory table, causing a bright safe burst of colorful stars`,
        dialogue: `By exploring this, we discover that there is a secret balance! It's not magic, it is pure science and wonder!`
      },
      {
        panel_number: 4,
        narrative_stage: "Conclusion",
        concept: `${capChar} gives a confident thumbs-up with a smiling face and a cute comic background burst`,
        dialogue: `That is why ${formattedTopic} is so crucial! What other question do you have? I am ready!`
      }
    ];

    assetList = panelsData.map(p => ({
      panel_number: p.panel_number,
      narrative_stage: p.narrative_stage,
      panel_visual_description_concept: p.concept,
      panel_image: generateComicPanelSvg(character, formattedTopic, p.panel_number, p.concept, p.dialogue),
      dialogue_bubble_text: p.dialogue
    }));

    return {
      topic: formattedTopic,
      character: character,
      comic_book_asset: assetList
    };
  }

  const lowerTopic = formattedTopic.toLowerCase();
  if (lowerTopic.includes("photosynthesis") || lowerTopic.includes("plant")) {
    const panelsData = [
      {
        panel_number: 1,
        narrative_stage: "Introduction",
        concept: `${capChar} stands in a sunny garden, wearing a colorful explorer hat and holding a magnifying glass next to a giant smiling flower`,
        dialogue: `Greetings adventurers! Today we are learning how plants 'cook' their food using sunlight! It's called Photosynthesis!`
      },
      {
        panel_number: 2,
        narrative_stage: "Core Mechanism",
        concept: `${capChar} zooms in on a leaf showing green solar panel cells. Golden beams of sunlight bounce off the leaf`,
        dialogue: `Look closely! The green stuff is Chlorophyll. It acts like tiny solar panels, catching sunlight for energy!`
      },
      {
        panel_number: 3,
        narrative_stage: "Development",
        concept: `${capChar} acts like a waiter, serving water droplets from roots and floating carbon dioxide bubbles from the air`,
        dialogue: `Next, the leaf drinks carbon dioxide from the air and water from the roots! This is the recipe's ingredients!`
      },
      {
        panel_number: 4,
        narrative_stage: "Conclusion",
        concept: `${capChar} eats a tasty berry and blows out a fresh bubble of pure air. The sun shines brightly`,
        dialogue: `Alakazam! Sunlight + Water + CO2 makes sweet sugar for the plant to grow, and releases fresh Oxygen for us to breathe!`
      }
    ];

    assetList = panelsData.map(p => ({
      panel_number: p.panel_number,
      narrative_stage: p.narrative_stage,
      panel_visual_description_concept: p.concept,
      panel_image: generateComicPanelSvg(character, "Photosynthesis", p.panel_number, p.concept, p.dialogue),
      dialogue_bubble_text: p.dialogue
    }));

    return {
      topic: "Photosynthesis",
      character: character,
      comic_book_asset: assetList
    };
  }

  if (lowerTopic.includes("gravity") || lowerTopic.includes("fall") || lowerTopic.includes("orbit")) {
    const panelsData = [
      {
        panel_number: 1,
        narrative_stage: "Introduction",
        concept: `${capChar} stands under an apple tree, holding a heavy iron weight and a light fluffy feather in each hand`,
        dialogue: `Hey kids! Have you ever wondered why we don't float away into outer space? It's all thanks to Gravity!`
      },
      {
        panel_number: 2,
        narrative_stage: "Core Mechanism",
        concept: `${capChar} drops both weight and feather. An invisible magnetic grid pulling them down towards Earth is visible`,
        dialogue: `Gravity is an invisible pull-force that every object has. The bigger the object, like our massive planet Earth, the stronger the pull!`
      },
      {
        panel_number: 3,
        narrative_stage: "Development",
        concept: `${capChar} leaps high in the air wearing a trampoline helmet, but instantly comes right back down with a funny BOING!`,
        dialogue: `No matter how high you jump, gravity pulls you right back! It acts like Earth's seatbelt keeping our feet safe on the ground.`
      },
      {
        panel_number: 4,
        narrative_stage: "Conclusion",
        concept: `${capChar} stands on top of a globe next to a spinning satellite showing satellites orbiting Earth in perfect circles`,
        dialogue: `Gravity also keeps the Moon orbiting us and the Earth orbiting the Sun! It is the cosmic glue of our universe!`
      }
    ];

    assetList = panelsData.map(p => ({
      panel_number: p.panel_number,
      narrative_stage: p.narrative_stage,
      panel_visual_description_concept: p.concept,
      panel_image: generateComicPanelSvg(character, "Gravity", p.panel_number, p.concept, p.dialogue),
      dialogue_bubble_text: p.dialogue
    }));

    return {
      topic: "Gravity",
      character: character,
      comic_book_asset: assetList
    };
  }

  // Generic customized adventure for any other topic
  const panelsData = [
    {
      panel_number: 1,
      narrative_stage: "Introduction",
      concept: `${capChar} stands in a comic-book styled laboratory or ancient library, holding a mysterious book titled "${capTopic}"`,
      dialogue: `Welcome! Today, we are setting off on an epic comic mission to explore the mystery of ${capTopic}!`
    },
    {
      panel_number: 2,
      narrative_stage: "Core Mechanism",
      concept: `${capChar} points to a chalkboard or floating hologram showcasing the main core components of ${formattedTopic}`,
      dialogue: `Here is our first clue! To understand ${formattedTopic}, we need to look at how its key parts work together.`
    },
    {
      panel_number: 3,
      narrative_stage: "Development",
      concept: `${capChar} jumps into a futuristic portal or spaceship, surrounded by dynamic comic action bubbles and speed lines`,
      dialogue: `Whoosh! Let's travel inside to see it in action! This reveals how it impacts the world around us!`
    },
    {
      panel_number: 4,
      narrative_stage: "Conclusion",
      concept: `${capChar} stands proudly, holding up a sparkling trophy representing knowledge of ${formattedTopic} with smiling characters`,
      dialogue: `Success! Now we know the core secret of ${formattedTopic}! Knowledge is our ultimate superhero power!`
    }
  ];

  assetList = panelsData.map(p => ({
    panel_number: p.panel_number,
    narrative_stage: p.narrative_stage,
    panel_visual_description_concept: p.concept,
    panel_image: generateComicPanelSvg(character, formattedTopic, p.panel_number, p.concept, p.dialogue),
    dialogue_bubble_text: p.dialogue
  }));

  return {
    topic: formattedTopic,
    character: character,
    comic_book_asset: assetList
  };
}

// 2. Server-side API endpoint for comic generation
app.post("/api/generate", async (req, res) => {
  const { topic, character, followUp } = req.body;

  if (!topic || !character) {
    return res.status(400).json({ error: "Learning topic and Character are required." });
  }

  // Handle lack of API key gracefully
  if (!ai) {
    const fallbackComic = generateDemoComic(topic, character, followUp);
    return res.json({ comic: fallbackComic, isDemo: true });
  }

  try {
    // Construct the prompt blueprint - strictly optimized for narrative and multimodal synthesis
    let promptBlueprint = "";
    if (!followUp) {
      promptBlueprint = `
        You are an elite children's educational comic book writer, Creative Director, and Multimodal Artist.
        Task: Create a highly engaging 4-panel educational comic strip about "${topic}" starring "${character}" as the main guide/protagonist.
        Aesthetic Goal: Hand-drawn, expressive children's graphic novel with rich watercolor/colored-pencil textures and distinct ink line art. No sterile digital grids.

        Mandatory Narrative Structure (Exactly 4 Panels):
        1. "Hook" Narrative Stage: The character "${character}" discovers the topic "${topic}" visualized as a simple mystery or puzzle. Use cozy warm local tones.
        2. "Mechanism" Narrative Stage: The character enters the abstracted landscape of the topic (e.g., flying through data clouds, gears, molecular structures, or Gemini processor blocks) to see how it works. Use dynamic, ethereal cloud rainbow tones.
        3. "Result" Narrative Stage: The character achieves a successful outcome or manages the machine by mastering the concept. Use vibrant, action-filled triumphant colors.
        4. "Synopsis" Narrative Stage: The character synthesizes the learning and relates it back to the real world (e.g. as a completed report, or a successful mobile app).

        Instructions for visual descriptions ("panel_visual_description_concept"):
        - Describe fully realized visual action scenes in watercolor and ink style.
        - Specify "${character}"'s dynamic actions, likeness, and facial expressions.
        - **NEVER** include unrequested text boxes, sterile "INTRODUCTION" banners, panel descriptions as text within the image, or system telemetry labels. All educational concepts must be visualized purely through literal, charming visual metaphors (e.g., pointing to "The Phone's Private Mind" map, flying through physical "Data Clouds").

        Instructions for dialogues ("dialogue_bubble_text"):
        - Dialogues MUST be complete, engaging, play-by-brand sentences.
        - **NEVER** use truncated placeholders or incomplete statements like "Hey kids! Ever wonder ho...".

        Format your response as a strict JSON object matching this exact schema (no additional commentary, return just the JSON):
        {
          "topic": "${topic}",
          "character": "${character}",
          "comic_book_asset": [
            {
              "panel_number": 1,
              "narrative_stage": "Hook",
              "panel_visual_description_concept": "Detailed description for the Hook scene in warm local watercolor/ink style.",
              "dialogue_bubble_text": "Engaging complete sentence introducing the mystery."
            },
            {
              "panel_number": 2,
              "narrative_stage": "Mechanism",
              "panel_visual_description_concept": "Detailed description of character entering the micro-world mechanism with ethereal rainbow streams.",
              "dialogue_bubble_text": "Engaging complete sentence explaining the core mechanism."
            },
            {
              "panel_number": 3,
              "narrative_stage": "Result",
              "panel_visual_description_concept": "Detailed description of the triumphant result mastering the machine.",
              "dialogue_bubble_text": "Engaging complete sentence showing success."
            },
            {
              "panel_number": 4,
              "narrative_stage": "Synopsis",
              "panel_visual_description_concept": "Detailed description relating the learning back to real-world applications.",
              "dialogue_bubble_text": "Engaging complete sentence wrapping up the adventure."
            }
          ]
        }
      `;
    } else {
      promptBlueprint = `
        You are an elite children's educational comic book writer, Creative Director, and Multimodal Artist.
        We are continuing an active adventure session on the topic "${topic}" featuring "${character}".
        The user has asked a follow-up question: "${followUp}".

        Generate 4 completely NEW comic panels that directly answer and explain this follow-up question in comic format.
        Maintain "${character}" as the exact same protagonist, preserving the exciting children's book watercolor/colored-pencil style.
        Follow the sequential narrative structure: Hook (the question's mystery) -> Mechanism (how the answer works) -> Result (putting the answer to test) -> Synopsis (practical outcome).

        Instructions:
        - Dialogue must be play-by-brand, complete sentences inside speech balloons. No truncated placeholders.
        - Visual descriptions must contain zero text labels, introduction banners, or digital grids. Communicate concepts implicitly through charming, physical metaphors.

        Format your response as a strict JSON object matching this exact schema:
        {
          "topic": "${topic}",
          "character": "${character}",
          "comic_book_asset": [
            {
              "panel_number": 1,
              "narrative_stage": "Hook",
              "panel_visual_description_concept": "Detailed watercolor visual concept addressing the follow-up mystery.",
              "dialogue_bubble_text": "Engaging complete dialogue introducing the answer's mystery."
            },
            {
              "panel_number": 2,
              "narrative_stage": "Mechanism",
              "panel_visual_description_concept": "Detailed watercolor visual concept showing the mechanics.",
              "dialogue_bubble_text": "Engaging complete dialogue explaining the mechanism."
            },
            {
              "panel_number": 3,
              "narrative_stage": "Result",
              "panel_visual_description_concept": "Detailed watercolor visual concept demonstrating successful testing.",
              "dialogue_bubble_text": "Engaging complete dialogue showing success."
            },
            {
              "panel_number": 4,
              "narrative_stage": "Synopsis",
              "panel_visual_description_concept": "Detailed watercolor visual concept relating it back to practical use.",
              "dialogue_bubble_text": "Engaging complete dialogue wrapping up."
            }
          ]
        }
      `;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptBlueprint,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["topic", "character", "comic_book_asset"],
          properties: {
            topic: { type: Type.STRING },
            character: { type: Type.STRING },
            comic_book_asset: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["panel_number", "narrative_stage", "panel_visual_description_concept", "dialogue_bubble_text"],
                properties: {
                  panel_number: { type: Type.INTEGER },
                  narrative_stage: { type: Type.STRING },
                  panel_visual_description_concept: { type: Type.STRING },
                  dialogue_bubble_text: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response received from Gemini API");
    }

    const cleanedText = text.trim();
    const comicData = JSON.parse(cleanedText);

    // Multimodal synthesis: generate visual assets for each panel in parallel using gemini-3.1-flash-lite-image
    const assetPromises = comicData.comic_book_asset.map(async (panel: any) => {
      try {
        const isLocal = panel.narrative_stage.toLowerCase() === "hook" || panel.panel_number === 1;
        const colorPaletteDesc = isLocal
          ? "cozy, warm local tones (deep ambers, rich wood browns, cozy golden lamplight, hand-painted watercolor washes)"
          : "dynamic, ethereal cloud tones (glowing neon, vibrant rainbow data streams, magical starbursts, watercolor wash)";

        const imagePrompt = `A rich, hand-drawn comic panel illustration with vibrant, fully realized watercolor and colored pencil textures, and distinct ink line art, in the charming aesthetic of a children's graphic novel. No digital gradients or sterile shapes.
Character: ${character} is clearly depicted with high likeness, expressive facial details, and actively navigating the scene.
Scene & Metaphor: ${panel.panel_visual_description_concept}.
Color Style: ${colorPaletteDesc}.
Aesthetic: Warm, energetic, highly cohesive artistic style across all panels. No sterile digital grids, text banners, or technical telemetry.
Speech Bubble: Superimpose a clean, hand-drawn cream-colored speech bubble inside the panel containing the complete play-by-brand dialogue: "${panel.dialogue_bubble_text}". Legible comic-book style lettering. No other text overlays, labels, or titles in the illustration itself.`;
        
        const imageResponse = await ai!.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [{ text: imagePrompt }]
          },
          config: {
            imageConfig: {
              aspectRatio: "4:3"
            }
          }
        });

        let base64Image = "";
        const parts = imageResponse.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            base64Image = part.inlineData.data;
            break;
          }
        }

        if (base64Image) {
          panel.panel_image = `data:image/png;base64,${base64Image}`;
        } else {
          // Fallback to high-quality SVG on missing inlineData
          panel.panel_image = generateComicPanelSvg(character, topic, panel.panel_number, panel.panel_visual_description_concept, panel.dialogue_bubble_text);
        }
      } catch (imgErr) {
        console.error(`Error generating image for panel ${panel.panel_number}:`, imgErr);
        // Fallback to beautiful custom SVG on generation failure
        panel.panel_image = generateComicPanelSvg(character, topic, panel.panel_number, panel.panel_visual_description_concept, panel.dialogue_bubble_text);
      }
      return panel;
    });

    await Promise.all(assetPromises);

    return res.json({ comic: comicData, isDemo: false });

  } catch (err: any) {
    console.error("Gemini Cloud generation error, falling back to local simulation:", err);
    const fallbackComic = generateDemoComic(topic, character, followUp);
    return res.json({ comic: fallbackComic, isDemo: true, error: err.message });
  }
});

// Serve frontend assets in development or production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ComicLearn AI backend server listening on http://localhost:${PORT}`);
  });
}

startServer();
