/*
 * Brand configuration.
 * Add a new customer by copying the "haven" block, changing the values,
 * and loading the site with ?brand=<id>. Anything left out falls back to
 * the "haven" defaults. Scripts (chat, call transcript, email, summaries)
 * are generated from these fields in scenario.js, so most rebrands only
 * need this file.
 */
window.BRANDS = {
  haven: {
    id: 'haven',
    company: 'Haven & Hill',
    tagline: 'Furniture for the way you live',
    supportFrom: 'Customer Support (+1 876 555 0100)',
    workspaceName: 'CSM/FSM Configurable Workspace',
    logo: {
      text: 'H',          // shown in the top-left mark when no image is set
      image: '',          // optional: URL or data: URI of a square logo
      wordmark: 'Haven & Hill'
    },
    theme: {
      nav: '#0e2430',      // top navigation bar
      navText: '#e8f1f4',
      accent: '#1a7c8c',   // primary buttons, links, active tabs
      accentSoft: '#e3f2f4',
      highlight: '#62b246',// active tab underline / success
      railTop: '#0e2430',  // left rail gradient
      railBottom: '#2f9e5b'
    },
    agent: { name: 'Richie Barnes', first: 'Richie', initials: 'RB', email: 'richie.barnes@havenandhill.example' },
    customer: {
      name: 'Charlotte Gong', first: 'Charlotte', initials: 'CG',
      points: 1200,
      email: 'c.gong@gmail.com',
      mobile: '+1 444 867 6784',
      business: '+1 444 287 7834',
      street: '747 Howard St.',
      city: 'San Diego, CA',
      timezone: 'USA / California',
      language: 'En',
      device: 'Mobile',
      pointsHistory: [
        { date: 'Mar 01', label: 'Online purchase', pts: 900 },
        { date: 'Feb 20', label: 'Online purchase', pts: 300 }
      ]
    },
    order: {
      number: 'ORD10801021',
      title: '3-Piece Sectional with Ottoman',
      shortTitle: '3-piece sectional',
      missingItem: 'ottoman',
      restockDays: 4,
      orderDate: '2025-01-03 09:07:17'
    },
    product: {
      name: 'Anton 3-Piece Ottoman Sectional',
      short: 'Anton 3-Piece...',
      sku: 'PRD0087631',
      price: '$835.26',
      colors: ['Gray', 'White', 'Black', 'Forest green']
    },
    stores: [
      { address: '4995 Clairemont Dr, San Diego, CA 92117', qty: [14, 13, 11, 12] },
      { address: '3245 Sports Arena Blvd, San Diego, CA 92110', qty: [12, 14, 12, 12] },
      { address: '3355 Rosecrans St, San Diego, CA 92110', qty: [10, 10, 10, 10] },
      { address: '8550 Rio San Diego Dr, San Diego, CA 92108', qty: [5, 5, 5, 5] },
      { address: '4589 La Jolla Village Dr, San Diego, CA 92122', qty: [8, 7, 8, 7] }
    ],
    pickup: { storeIndex: 0, time: '12:00 PM', pin: '1024', daysFromNow: 2 },
    bonusPoints: 1000,
    secondCustomer: {
      name: 'Anika Choudhury', first: 'Anika', initials: 'AC',
      points: 900, email: 'ani.c112@gmail.com', mobile: '+1 444 867 6612',
      business: '+1 444 003 1125', street: '1013 Briagate Dr.', city: 'Austin, TX',
      product: 'Haven Heat RH1 - Room Heater', productShort: 'Haven Heat RH1',
      orderNumber: 'ORD10801025', subject: 'Status of my recent order for room heater'
    },
    kb: {
      number: 'KB0012389',
      title: 'Return & refund policy',
      summary: 'You have 30 calendar days to return an item from the date of purchase. The return shipping costs are your responsibility and are non-refundable. Once the item is received, a refund will be initiated within 14 days from receipt.'
    }
  },

  // Example second brand to show how a rebrand works: ?brand=northwind
  northwind: {
    id: 'northwind',
    company: 'Northwind Outdoors',
    supportFrom: 'Northwind Care (+1 800 555 0147)',
    logo: { text: 'N', wordmark: 'Northwind Outdoors' },
    theme: {
      nav: '#1b2a1f', navText: '#eef5ee', accent: '#2f6f3e', accentSoft: '#e4f0e6',
      highlight: '#d98e04', railTop: '#1b2a1f', railBottom: '#d98e04'
    },
    agent: { name: 'Jordan Ellis', first: 'Jordan', initials: 'JE', email: 'jordan.ellis@northwind.example' },
    customer: {
      name: 'Maya Torres', first: 'Maya', initials: 'MT', points: 2400,
      email: 'maya.torres@gmail.com', mobile: '+1 303 555 0182', business: '+1 303 555 0119',
      street: '1450 Larimer St.', city: 'Denver, CO', timezone: 'USA / Colorado',
      pointsHistory: [
        { date: 'Apr 11', label: 'Online purchase', pts: 1500 },
        { date: 'Feb 02', label: 'In-store purchase', pts: 900 }
      ]
    },
    order: {
      number: 'ORD20455310', title: '4-Person Camping Bundle', shortTitle: 'camping bundle',
      missingItem: 'tent rainfly', restockDays: 5, orderDate: '2025-03-14 10:22:41'
    },
    product: { name: 'Summit 4P Tent Rainfly', short: 'Summit 4P...', sku: 'PRD0041209', price: '$129.00', colors: ['Slate', 'Sage', 'Rust', 'Sand'] },
    stores: [
      { address: '1600 Platte St, Denver, CO 80202', qty: [6, 4, 3, 5] },
      { address: '8505 Park Meadows Ctr Dr, Lone Tree, CO 80124', qty: [3, 2, 4, 2] },
      { address: '14500 W Colfax Ave, Lakewood, CO 80401', qty: [2, 2, 1, 3] }
    ],
    pickup: { storeIndex: 0, time: '11:30 AM', pin: '4471', daysFromNow: 1 },
    bonusPoints: 500,
    secondCustomer: {
      name: 'Sam Patel', first: 'Sam', initials: 'SP', points: 650,
      email: 'sam.patel@gmail.com', mobile: '+1 720 555 0133', business: '+1 720 555 0190',
      street: '300 Pearl St.', city: 'Boulder, CO',
      product: 'TrailLite Headlamp 400', productShort: 'TrailLite 400',
      orderNumber: 'ORD20455377', subject: 'Status of my recent order for headlamp'
    },
    kb: {
      number: 'KB0020417', title: 'Returns & exchanges',
      summary: 'Items can be returned or exchanged within 60 days of purchase. Store pickup orders are held for 7 days. Refunds are issued to the original payment method within 10 business days.'
    }
  }
};
