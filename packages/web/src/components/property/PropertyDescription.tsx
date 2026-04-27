'use client';

import { motion } from 'framer-motion';
import {
  Waves, Flame, Droplets, KeyRound, Bell, Wifi, Car, UtensilsCrossed,
  Umbrella, TreePine, Dumbbell, Wind, PawPrint, Mountain, Building2,
  ShieldCheck, Tv, Coffee, Bath, Shirt, Bike, Sailboat, Star, Sparkles,
  Sun, Baby, Accessibility, Package,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface PropertyDescriptionProps {
  description: string;
}

// Keyword → icon map (checked against lower-case item text)
const ICON_MAP: { keywords: string[]; icon: LucideIcon; color: string; bg: string }[] = [
  { keywords: ['pool', 'swimming'],               icon: Waves,          color: 'text-blue-600',   bg: 'bg-blue-50'    },
  { keywords: ['fireplace', 'fire place'],        icon: Flame,          color: 'text-orange-500', bg: 'bg-orange-50'  },
  { keywords: ['hot tub', 'jacuzzi', 'spa', 'sauna'], icon: Droplets,   color: 'text-cyan-600',   bg: 'bg-cyan-50'    },
  { keywords: ['self check-in', 'self checkin', 'keypad', 'lockbox', 'check-in'], icon: KeyRound, color: 'text-violet-600', bg: 'bg-violet-50' },
  { keywords: ['concierge', '24/7'],              icon: Bell,           color: 'text-amber-600',  bg: 'bg-amber-50'   },
  { keywords: ['wifi', 'internet', 'wi-fi'],      icon: Wifi,           color: 'text-indigo-600', bg: 'bg-indigo-50'  },
  { keywords: ['parking', 'garage', 'car'],       icon: Car,            color: 'text-slate-600',  bg: 'bg-slate-50'   },
  { keywords: ['kitchen', 'cooking', 'chef'],     icon: UtensilsCrossed,color: 'text-emerald-600',bg: 'bg-emerald-50' },
  { keywords: ['beach', 'oceanfront', 'seaside'], icon: Umbrella,       color: 'text-sky-600',    bg: 'bg-sky-50'     },
  { keywords: ['garden', 'yard', 'patio', 'forest', 'nature'], icon: TreePine, color: 'text-green-600', bg: 'bg-green-50' },
  { keywords: ['gym', 'fitness', 'workout'],      icon: Dumbbell,       color: 'text-red-600',    bg: 'bg-red-50'     },
  { keywords: ['ac', 'air conditioning', 'climate control'], icon: Wind, color: 'text-teal-600',  bg: 'bg-teal-50'    },
  { keywords: ['pet', 'dog', 'cat'],              icon: PawPrint,       color: 'text-rose-500',   bg: 'bg-rose-50'    },
  { keywords: ['mountain', 'view', 'scenic'],     icon: Mountain,       color: 'text-stone-600',  bg: 'bg-stone-50'   },
  { keywords: ['balcony', 'terrace', 'rooftop'],  icon: Building2,      color: 'text-purple-600', bg: 'bg-purple-50'  },
  { keywords: ['security', 'safe', 'alarm'],      icon: ShieldCheck,    color: 'text-green-700',  bg: 'bg-green-50'   },
  { keywords: ['tv', 'television', 'netflix', 'streaming'], icon: Tv,   color: 'text-blue-500',   bg: 'bg-blue-50'    },
  { keywords: ['coffee', 'espresso', 'nespresso'],icon: Coffee,         color: 'text-yellow-700', bg: 'bg-yellow-50'  },
  { keywords: ['bathtub', 'bath', 'shower'],      icon: Bath,           color: 'text-blue-400',   bg: 'bg-blue-50'    },
  { keywords: ['washer', 'dryer', 'laundry'],     icon: Shirt,          color: 'text-indigo-500', bg: 'bg-indigo-50'  },
  { keywords: ['bike', 'bicycle', 'cycling'],     icon: Bike,           color: 'text-lime-600',   bg: 'bg-lime-50'    },
  { keywords: ['boat', 'kayak', 'water sport'],   icon: Sailboat,       color: 'text-cyan-700',   bg: 'bg-cyan-50'    },
  { keywords: ['sun', 'sunny', 'tropical'],       icon: Sun,            color: 'text-yellow-500', bg: 'bg-yellow-50'  },
  { keywords: ['baby', 'crib', 'kids', 'child'],  icon: Baby,           color: 'text-pink-500',   bg: 'bg-pink-50'    },
  { keywords: ['accessible', 'wheelchair'],       icon: Accessibility,  color: 'text-blue-700',   bg: 'bg-blue-50'    },
  { keywords: ['storage', 'luggage'],             icon: Package,        color: 'text-neutral-600',bg: 'bg-neutral-50' },
];

function getIconForItem(text: string): { icon: LucideIcon; color: string; bg: string } {
  const lower = text.toLowerCase();
  for (const entry of ICON_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return { icon: entry.icon, color: entry.color, bg: entry.bg };
    }
  }
  return { icon: Sparkles, color: 'text-violet-500', bg: 'bg-violet-50' };
}

/** Splits description into: preamble text + "What makes unique" header + items list */
function parseDescription(desc: string): { preamble: string; uniqueHeader: string | null; items: string[] } {
  // Match variations like "What makes this place unique:", "What makes it special:", etc.
  const splitRegex = /^(.*?(?:what makes[^\n:]*:|highlights?:|features?:))\s*$/im;
  const match = splitRegex.exec(desc);

  if (!match) {
    return { preamble: desc, uniqueHeader: null, items: [] };
  }

  const matchIndex = desc.toLowerCase().indexOf(match[0].trim().toLowerCase());
  const preamble = desc.slice(0, matchIndex).trim();
  const uniqueHeader = match[0].trim();
  const rest = desc.slice(matchIndex + match[0].length).trim();

  const items = rest
    .split('\n')
    .map((l) => l.replace(/^[-•*·]\s*/, '').trim())
    .filter(Boolean);

  return { preamble, uniqueHeader, items };
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.94 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 320, damping: 22 } },
};

export function PropertyDescription({ description }: PropertyDescriptionProps) {
  const { preamble, uniqueHeader, items } = parseDescription(description ?? '');

  return (
    <div className="space-y-5">
      {/* Main description text */}
      {preamble && (
        <p className="text-neutral-700 leading-relaxed whitespace-pre-line font-light">{preamble}</p>
      )}

      {/* "What makes this place unique" section */}
      {uniqueHeader && items.length > 0 && (
        <div className="rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-indigo-50/60 via-violet-50/40 to-white p-5 space-y-4">
          {/* Section header */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-sm">
              <Star className="h-3.5 w-3.5 fill-white text-white" />
            </div>
            <p className="text-sm font-semibold text-indigo-700 tracking-wide">{uniqueHeader}</p>
          </div>

          {/* Feature pills */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="flex flex-wrap gap-2.5"
          >
            {items.map((item, i) => {
              const { icon: Icon, color, bg } = getIconForItem(item);
              return (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={`flex items-center gap-2 rounded-2xl border border-white/80 px-3.5 py-2 shadow-sm cursor-default select-none ${bg}`}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-xl bg-white shadow-sm shrink-0 ${color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm font-medium text-neutral-800">{item}</span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      )}
    </div>
  );
}
