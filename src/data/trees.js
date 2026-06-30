import { INVENTORY } from '../config/siteConfig'

export const TREE_STATS = {
  total:     INVENTORY.total,
  rented:    INVENTORY.booked,
  available: INVENTORY.available,
}

// Indian + Marathi first names
const FIRST = [
  // Hindi/North Indian
  'Aarav','Vivaan','Aditya','Vihaan','Arjun','Reyansh','Ayaan','Atharv','Dhruv','Pranav',
  'Advait','Ritvik','Aarush','Ishaan','Shiv','Rudra','Kabir','Darsh','Veer','Rohan',
  'Priya','Ananya','Diya','Siya','Riya','Anya','Tanvi','Meera','Kavya','Nisha',
  'Pooja','Divya','Shreya','Simran','Komal','Isha','Neha','Sakshi','Swati','Deepa',
  'Rahul','Vikram','Nikhil','Amit','Suresh','Deepak','Ravi','Ajay','Vijay','Sanjay',
  // Marathi
  'Omkar','Prathamesh','Yash','Akash','Kedar','Amol','Ganesh','Sandesh','Mahesh','Sachin',
  'Vishal','Prasad','Abhijit','Swapnil','Nitin','Yogesh','Kiran','Manoj','Satish','Dinesh',
  'Prachi','Shruti','Manasi','Rutuja','Sneha','Vrushali','Rasika','Aishwarya','Tejal','Mugdha',
  'Mrunali','Madhura','Supriya','Vaishali','Aparna','Sonali','Shital','Smita','Gauri','Nalini',
  'Atul','Rohit','Sagar','Nilesh','Hemant','Shrikant','Dattatray','Ramchandra','Balaji','Dnyanesh',
]

// Indian + Marathi last names
const LAST = [
  // Hindi/North Indian
  'Sharma','Patel','Singh','Kumar','Mehta','Joshi','Gupta','Verma','Agarwal','Rao',
  'Nair','Iyer','Reddy','Shah','Desai','Mishra','Tiwari','Pandey','Chaudhary','Chauhan',
  'Srivastava','Malhotra','Bose','Kapoor','Chopra','Khanna','Bhatia','Sethi','Saxena','Pillai',
  // Marathi
  'Patil','Shinde','Jadhav','Gaikwad','Kamble','More','Bhosale','Kale','Sawant','Kulkarni',
  'Deshpande','Wagh','Pawar','Naik','Chavan','Mhatre','Thakare','Bankar','Sutar','Lokhande',
  'Salunkhe','Waghmare','Thorat','Mane','Godse','Dhole','Gade','Kadam','Nikam','Phule',
]

// Seeded pseudo-random — stable across reloads
function rand(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Generate 278 guaranteed-unique dummy names
function buildNamePool(count) {
  const used = new Set()
  const pool = []
  let s = 0
  while (pool.length < count) {
    const fi   = Math.floor(rand(s * 3 + 1)  * FIRST.length)
    const li   = Math.floor(rand(s * 7 + 5)  * LAST.length)
    const name = `${FIRST[fi]} ${LAST[li]}`
    if (!used.has(name)) { used.add(name); pool.push(name) }
    s++
  }
  return pool
}

const DUMMY_NAMES = buildNamePool(INVENTORY.booked)

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
      renterName:    isRented ? DUMMY_NAMES[i] : null,
      isRealBooking: false,
    }
  })
}

export const trees = generateTrees()
