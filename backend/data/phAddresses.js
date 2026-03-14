export const PH_ADDRESS_DATA = [
  {
    code: 'NCR',
    name: 'National Capital Region (NCR)',
    provinces: [
      {
        name: 'Metro Manila',
        municipalities: [
          { name: 'Quezon City', postalCode: '1100', barangays: ['Batasan Hills', 'Commonwealth', 'Tandang Sora', 'Bagumbayan'] },
          { name: 'City of Manila', postalCode: '1000', barangays: ['Ermita', 'Malate', 'Sampaloc', 'Tondo'] },
          { name: 'Makati City', postalCode: '1200', barangays: ['Bel-Air', 'Bangkal', 'Poblacion', 'San Isidro'] },
          { name: 'Pasig City', postalCode: '1600', barangays: ['Kapitolyo', 'Ortigas', 'Rosario', 'San Miguel'] }
        ]
      }
    ]
  },
  {
    code: 'REGION_III',
    name: 'Central Luzon',
    provinces: [
      {
        name: 'Bulacan',
        municipalities: [
          { name: 'City of Malolos', postalCode: '3000', barangays: ['Mojon', 'Santo Cristo', 'Sumapang Matanda', 'Tikay'] },
          { name: 'Meycauayan City', postalCode: '3020', barangays: ['Banga', 'Calvario', 'Camalig', 'Saluysoy'] },
          { name: 'Santa Maria', postalCode: '3022', barangays: ['Bagbaguin', 'Bulac', 'Caysio', 'Poblacion'] }
        ]
      },
      {
        name: 'Pampanga',
        municipalities: [
          { name: 'City of San Fernando', postalCode: '2000', barangays: ['Del Carmen', 'Dolores', 'Lara', 'Sindalan'] },
          { name: 'Angeles City', postalCode: '2009', barangays: ['Balibago', 'Cutcut', 'Lourdes Sur', 'Pulung Maragul'] }
        ]
      }
    ]
  },
  {
    code: 'REGION_IV_A',
    name: 'CALABARZON',
    provinces: [
      {
        name: 'Cavite',
        municipalities: [
          { name: 'Bacoor City', postalCode: '4102', barangays: ['Alima', 'Molino III', 'Talaba II', 'Zapote V'] },
          { name: 'Dasmarinas City', postalCode: '4114', barangays: ['Burol', 'Langkaan I', 'Salitran I', 'Sampaloc I'] },
          { name: 'Imus City', postalCode: '4103', barangays: ['Anabu I-A', 'Bucandala', 'Medicion I-C', 'Tanzang Luma I'] }
        ]
      },
      {
        name: 'Laguna',
        municipalities: [
          { name: 'Calamba City', postalCode: '4027', barangays: ['Canlubang', 'Halang', 'Parian', 'Real'] },
          { name: 'Santa Rosa City', postalCode: '4026', barangays: ['Balibago', 'Don Jose', 'Malitlit', 'Tagapo'] },
          { name: 'Binan City', postalCode: '4024', barangays: ['Canlalay', 'Ganado', 'San Antonio', 'Zapote'] }
        ]
      }
    ]
  },
  {
    code: 'REGION_VI',
    name: 'Western Visayas',
    provinces: [
      {
        name: 'Iloilo',
        municipalities: [
          { name: 'Iloilo City', postalCode: '5000', barangays: ['Jaro', 'La Paz', 'Mandurriao', 'Molo'] },
          { name: 'Passi City', postalCode: '5037', barangays: ['Agtabo', 'Buenavista', 'Calaigang', 'Poblacion Ilawod'] }
        ]
      },
      {
        name: 'Negros Occidental',
        municipalities: [
          { name: 'Bacolod City', postalCode: '6100', barangays: ['Alijis', 'Mansilingan', 'Tangub', 'Villamonte'] },
          { name: 'Kabankalan City', postalCode: '6111', barangays: ['Barangay 1', 'Barangay 2', 'Camansi', 'Tabugon'] }
        ]
      }
    ]
  },
  {
    code: 'REGION_VII',
    name: 'Central Visayas',
    provinces: [
      {
        name: 'Cebu',
        municipalities: [
          { name: 'Cebu City', postalCode: '6000', barangays: ['Guadalupe', 'Lahug', 'Mabolo', 'Talamban'] },
          { name: 'Lapu-Lapu City', postalCode: '6015', barangays: ['Basak', 'Gun-ob', 'Maribago', 'Pusok'] },
          { name: 'Mandaue City', postalCode: '6014', barangays: ['Banilad', 'Centro', 'Ibabao-Estancia', 'Tipolo'] }
        ]
      }
    ]
  },
  {
    code: 'REGION_X',
    name: 'Northern Mindanao',
    provinces: [
      {
        name: 'Misamis Oriental',
        municipalities: [
          { name: 'Cagayan de Oro City', postalCode: '9000', barangays: ['Balulang', 'Carmen', 'Macasandig', 'Nazareth'] },
          { name: 'Gingoog City', postalCode: '9014', barangays: ['20', '23', 'San Jose', 'Tinulongan'] }
        ]
      }
    ]
  },
  {
    code: 'REGION_XI',
    name: 'Davao Region',
    provinces: [
      {
        name: 'Davao del Sur',
        municipalities: [
          { name: 'Davao City', postalCode: '8000', barangays: ['Buhangin', 'Mintal', 'Talomo', 'Toril'] }
        ]
      },
      {
        name: 'Davao del Norte',
        municipalities: [
          { name: 'Tagum City', postalCode: '8100', barangays: ['Apokon', 'Madaum', 'Mankilam', 'Visayan Village'] }
        ]
      }
    ]
  }
];

export function getPhilippineAddressData() {
  return PH_ADDRESS_DATA;
}
