import { INVENTORY } from '../config/siteConfig'

export const TREE_STATS = {
  total:     INVENTORY.total,
  rented:    INVENTORY.booked,
  available: INVENTORY.available,
}

// Dummy Indian names for pre-rented trees (placeholder data, shown with ○ marker)
const FIRST = [
  'Aarav','Vivaan','Aditya','Vihaan','Arjun','Reyansh','Ayaan','Atharv','Dhruv','Pranav',
  'Advait','Ritvik','Aarush','Ishaan','Shiv','Rudra','Kabir','Darsh','Veer','Rohan',
  'Priya','Ananya','Diya','Siya','Riya','Anya','Tanvi','Meera','Kavya','Nisha',
  'Pooja','Divya','Shreya','Simran','Komal','Isha','Neha','Sakshi','Swati','Deepa',
  'Rahul','Vikram','Nikhil','Amit','Suresh','Deepak','Ravi','Ajay','Vijay','Sanjay',
]
const LAST = [
  'Sharma','Patel','Singh','Kumar','Mehta','Joshi','Gupta','Verma','Agarwal','Rao',
  'Nair','Iyer','Reddy','Shah','Desai','Mishra','Tiwari','Pandey','Chaudhary','Chauhan',
  'Srivastava','Malhotra','Bose','Kapoor','Chopra','Khanna','Bhatia','Sethi','Saxena','Pillai',
]

// Seeded pseudo-random so names look organic but are stable across reloads
function rand(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function fakeName(index) {
  const fi = Math.floor(rand(index * 3 + 1) * FIRST.length)
  const li = Math.floor(rand(index * 7 + 5) * LAST.length)
  return FIRST[fi] + ' ' + LAST[li]
}

export function generateTrees() {
  return Array.from({ length: INVENTORY.total }, (_, i) => {
    const num      = i + 1
    const id       = `MGO-${String(num).padStart(3, '0')}`
    const isRented = num <= INVENTORY.booked
    return {
      id,
      num,
      isRented,
      status:        isRented ? 'rented' : 'available',
      renterName:    isRented ? fakeName(i) : null,
      isRealBooking: false,  // true only for bookings fetched from spreadsheet at runtime
    }
  })
}

export const trees = generateTrees()
