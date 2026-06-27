const TRAFFIC_ALERTS = [
  {
    id: 1,
    title: 'Heavy congestion on Highway 410 North',
    description: 'Accident near Williams Parkway causing 15-min delays. Use Kennedy Rd as alternative.',
    severity: 'high',
    road: 'Hwy 410',
    updated: '2 min ago'
  },
  {
    id: 2,
    title: 'Moderate traffic on Queen Street East',
    description: 'Construction between Main St and Kennedy Rd. Expect slower speeds.',
    severity: 'medium',
    road: 'Queen St E',
    updated: '8 min ago'
  },
  {
    id: 3,
    title: 'Clear conditions on Steeles Avenue',
    description: 'Normal traffic flow. Smart signals optimized for eastbound traffic.',
    severity: 'low',
    road: 'Steeles Ave',
    updated: '5 min ago'
  },
  {
    id: 4,
    title: 'Lane closure on Bovaird Drive',
    description: 'Right lane closed for utility work. Minor delays expected.',
    severity: 'medium',
    road: 'Bovaird Dr',
    updated: '12 min ago'
  }
];

const SIGNAL_SYNC = [
  {
    id: 1,
    intersection: 'Main St & Queen St',
    status: 'synced',
    description: 'Green wave active — 3 consecutive green lights',
    savings: '2.5 min saved'
  },
  {
    id: 2,
    intersection: 'Kennedy Rd & Steeles Ave',
    status: 'adjusting',
    description: 'Adapting to peak hour traffic flow',
    savings: 'Optimizing...'
  },
  {
    id: 3,
    intersection: 'Hurontario St & Bovaird Dr',
    status: 'synced',
    description: 'Transit priority mode — bus approaching',
    savings: '1.8 min saved'
  },
  {
    id: 4,
    intersection: 'Goreway Dr & Queen St W',
    status: 'synced',
    description: 'Coordinated with adjacent intersections',
    savings: '1.2 min saved'
  }
];

const ROAD_SEGMENTS = [
  { name: 'Hwy 410', status: 'heavy' },
  { name: 'Queen St', status: 'moderate' },
  { name: 'Main St', status: 'good' },
  { name: 'Kennedy Rd', status: 'moderate' },
  { name: 'Steeles Ave', status: 'good' },
  { name: 'Bovaird Dr', status: 'moderate' },
  { name: 'Hurontario', status: 'good' },
  { name: 'Goreway Dr', status: 'good' },
  { name: 'Williams Pkwy', status: 'heavy' },
  { name: 'Airport Rd', status: 'moderate' },
  { name: 'McLaughlin', status: 'good' },
  { name: 'Chinguacousy', status: 'good' }
];

const TRANSIT_ROUTES = [
  {
    id: 'bt-1',
    type: 'bus',
    route: 'Route 1 — Queen',
    destination: 'Heart Lake Terminal',
    stop: 'Downtown Brampton',
    arrival: 4,
    crowd: 'low'
  },
  {
    id: 'bt-7',
    type: 'bus',
    route: 'Route 7 — Kennedy',
    destination: 'Bramalea GO Station',
    stop: 'Kennedy Rd & Steeles',
    arrival: 7,
    crowd: 'medium'
  },
  {
    id: 'bt-15',
    type: 'bus',
    route: 'Route 15 — Bramalea',
    destination: 'Shoppers World',
    stop: 'Bramalea City Centre',
    arrival: 2,
    crowd: 'low'
  },
  {
    id: 'bt-23',
    type: 'bus',
    route: 'Route 23 — Sandalwood',
    destination: 'Mount Pleasant GO',
    stop: 'Sandalwood Pkwy',
    arrival: 11,
    crowd: 'high'
  },
  {
    id: 'bt-30',
    type: 'bus',
    route: 'Route 30 — Airport',
    destination: 'Pearson Airport',
    stop: 'Goreway Dr & Queen',
    arrival: 8,
    crowd: 'medium'
  },
  {
    id: 'go-ki',
    type: 'train',
    route: 'GO Kitchener Line',
    destination: 'Union Station',
    stop: 'Brampton GO Station',
    arrival: 14,
    crowd: 'medium'
  },
  {
    id: 'go-ki-2',
    type: 'train',
    route: 'GO Kitchener Line',
    destination: 'Kitchener',
    stop: 'Mount Pleasant GO',
    arrival: 6,
    crowd: 'low'
  },
  {
    id: 'bt-4',
    type: 'bus',
    route: 'Route 4 — Chinguacousy',
    destination: 'Mayfield Secondary',
    stop: 'Chinguacousy & Bovaird',
    arrival: 5,
    crowd: 'low'
  }
];

const COMMUNITY_REPORTS = [
  {
    id: 1,
    type: 'Transit Delay',
    location: 'Route 7 at Kennedy & Steeles',
    details: 'Bus running 10 minutes behind schedule',
    time: '25 min ago',
    votes: 12
  },
  {
    id: 2,
    type: 'Traffic Congestion',
    location: 'Hwy 410 at Williams Parkway',
    details: 'Multi-vehicle accident blocking two lanes',
    time: '1 hr ago',
    votes: 34
  },
  {
    id: 3,
    type: 'Road Condition',
    location: 'Queen St E near Main',
    details: 'Large pothole in right lane causing swerving',
    time: '3 hrs ago',
    votes: 8
  }
];

const BRAMPTON_LOCATIONS = {
  home: '45 Main St N, Brampton',
  work: 'Bramalea City Centre',
  downtown: 'Downtown Brampton Terminal',
  goStation: 'Brampton GO Station',
  shoppers: 'Shoppers World Brampton',
  heartLake: 'Heart Lake Terminal',
  mountPleasant: 'Mount Pleasant GO Station',
  pearson: 'Pearson International Airport'
};

const ROUTE_TEMPLATES = [
  {
    mode: 'transit',
    icon: '🚌',
    label: 'Best Transit',
    getDuration: () => 28 + Math.floor(Math.random() * 10),
    steps: 'Walk 5 min → Route 7 Bus → Walk 3 min',
    eco: 'Low emissions',
    cost: '$3.65'
  },
  {
    mode: 'drive',
    icon: '🚗',
    label: 'Fastest Drive',
    getDuration: () => 18 + Math.floor(Math.random() * 8),
    steps: 'Main St → Kennedy Rd → Destination',
    eco: 'Higher emissions',
    cost: '$2.50 fuel'
  },
  {
    mode: 'bike',
    icon: '🚲',
    label: 'Eco Bike Route',
    getDuration: () => 35 + Math.floor(Math.random() * 10),
    steps: 'Etobicoke Creek Trail → City bike lanes',
    eco: 'Zero emissions',
    cost: 'Free'
  },
  {
    mode: 'all',
    icon: '🔀',
    label: 'Multi-Modal',
    getDuration: () => 32 + Math.floor(Math.random() * 8),
    steps: 'Drive to GO Station → Train → Walk 5 min',
    eco: 'Moderate emissions',
    cost: '$8.50'
  }
];
