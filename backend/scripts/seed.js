/**
 * Seed script — populates the database with sample doctors, users,
 * and 7 days of available slots so that doctor search, filters,
 * and the booking flow have real data to work with.
 *
 * Usage:
 *   node scripts/seed.js          # add sample data (skips doctors that already exist by email)
 *   node scripts/seed.js --reset  # wipe Users(role=doctor), Doctor profiles & their Slots first, then seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Slot = require('../models/Slot');

const SAMPLE_DOCTORS = [
  {
    name: 'Dr. Ananya Rao',
    email: 'ananya.rao@ambula.com',
    phone: '+91 98450 11223',
    specialization: 'General',
    location: 'Indiranagar, Bengaluru',
    consultationFee: 500,
    experience: 8,
    languages: ['English', 'Kannada', 'Hindi'],
    bio: 'General physician focused on preventive care and chronic disease management.',
    licenseNumber: 'MCI-10001',
    workingHours: { startTime: '09:00', endTime: '17:00', daysOfWeek: [0, 1, 2, 3, 4] },
  },
  {
    name: 'Dr. Karthik Iyer',
    email: 'karthik.iyer@ambula.com',
    phone: '+91 98450 22334',
    specialization: 'Cardiology',
    location: 'Koramangala, Bengaluru',
    consultationFee: 1200,
    experience: 15,
    languages: ['English', 'Kannada', 'Tamil'],
    bio: 'Senior cardiologist specializing in hypertension and heart failure management.',
    licenseNumber: 'MCI-10002',
    workingHours: { startTime: '10:00', endTime: '18:00', daysOfWeek: [0, 1, 2, 3, 4, 5] },
  },
  {
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@ambula.com',
    phone: '+91 98450 33445',
    specialization: 'Dermatology',
    location: 'HSR Layout, Bengaluru',
    consultationFee: 800,
    experience: 6,
    languages: ['English', 'Hindi'],
    bio: 'Dermatologist treating acne, skin allergies, and hair loss conditions.',
    licenseNumber: 'MCI-10003',
    workingHours: { startTime: '11:00', endTime: '19:00', daysOfWeek: [1, 2, 3, 4, 5] },
  },
  {
    name: 'Dr. Sunil Menon',
    email: 'sunil.menon@ambula.com',
    phone: '+91 98450 44556',
    specialization: 'Pediatrics',
    location: 'Jayanagar, Bengaluru',
    consultationFee: 600,
    experience: 12,
    languages: ['English', 'Kannada', 'Malayalam'],
    bio: 'Pediatrician with focus on child nutrition, vaccination, and growth tracking.',
    licenseNumber: 'MCI-10004',
    workingHours: { startTime: '09:00', endTime: '16:00', daysOfWeek: [0, 1, 2, 3, 4, 5] },
  },
  {
    name: 'Dr. Meera Nair',
    email: 'meera.nair@ambula.com',
    phone: '+91 98450 55667',
    specialization: 'Orthopedics',
    location: 'Whitefield, Bengaluru',
    consultationFee: 1000,
    experience: 10,
    languages: ['English', 'Hindi', 'Malayalam'],
    bio: 'Orthopedic surgeon specializing in joint pain, fractures, and sports injuries.',
    licenseNumber: 'MCI-10005',
    workingHours: { startTime: '10:00', endTime: '17:00', daysOfWeek: [1, 2, 3, 4, 5] },
  },
  {
    name: 'Dr. Arjun Verma',
    email: 'arjun.verma@ambula.com',
    phone: '+91 98450 66778',
    specialization: 'Neurology',
    location: 'MG Road, Bengaluru',
    consultationFee: 1500,
    experience: 18,
    languages: ['English', 'Hindi'],
    bio: 'Neurologist treating migraines, epilepsy, and movement disorders.',
    licenseNumber: 'MCI-10006',
    workingHours: { startTime: '09:00', endTime: '14:00', daysOfWeek: [0, 1, 2, 3, 4] },
  },
  {
    name: 'Dr. Lakshmi Pillai',
    email: 'lakshmi.pillai@ambula.com',
    phone: '+91 98450 77889',
    specialization: 'Gynecology',
    location: 'Malleshwaram, Bengaluru',
    consultationFee: 900,
    experience: 14,
    languages: ['English', 'Kannada', 'Tamil', 'Malayalam'],
    bio: "Gynecologist providing women's health, prenatal, and postnatal care.",
    licenseNumber: 'MCI-10007',
    workingHours: { startTime: '10:00', endTime: '18:00', daysOfWeek: [0, 1, 2, 3, 4, 5] },
  },
  {
    name: 'Dr. Rohan Kapoor',
    email: 'rohan.kapoor@ambula.com',
    phone: '+91 98450 88990',
    specialization: 'ENT',
    location: 'BTM Layout, Bengaluru',
    consultationFee: 700,
    experience: 9,
    languages: ['English', 'Hindi', 'Punjabi'],
    bio: 'ENT specialist treating sinus issues, hearing problems, and throat infections.',
    licenseNumber: 'MCI-10008',
    workingHours: { startTime: '09:00', endTime: '17:00', daysOfWeek: [0, 1, 2, 3, 4, 5] },
  },
  {
    name: 'Dr. Divya Krishnan',
    email: 'divya.krishnan@ambula.com',
    phone: '+91 98450 99001',
    specialization: 'Psychiatry',
    location: 'Indiranagar, Bengaluru',
    consultationFee: 1100,
    experience: 11,
    languages: ['English', 'Tamil'],
    bio: 'Psychiatrist specializing in anxiety, depression, and stress management.',
    licenseNumber: 'MCI-10009',
    workingHours: { startTime: '11:00', endTime: '19:00', daysOfWeek: [0, 1, 2, 3, 4] },
  },
  {
    name: 'Dr. Vikram Desai',
    email: 'vikram.desai@ambula.com',
    phone: '+91 98450 10112',
    specialization: 'Gastroenterology',
    location: 'Electronic City, Bengaluru',
    consultationFee: 1300,
    experience: 16,
    languages: ['English', 'Hindi', 'Gujarati'],
    bio: 'Gastroenterologist treating digestive disorders, acidity, and liver conditions.',
    licenseNumber: 'MCI-10010',
    workingHours: { startTime: '09:00', endTime: '15:00', daysOfWeek: [1, 2, 3, 4, 5] },
  },
  {
    name: 'Dr. Neha Joshi',
    email: 'neha.joshi@ambula.com',
    phone: '+91 98450 21223',
    specialization: 'General',
    location: 'JP Nagar, Bengaluru',
    consultationFee: 450,
    experience: 4,
    languages: ['English', 'Marathi', 'Hindi'],
    bio: 'Family physician for everyday illnesses, fever, infections, and routine checkups.',
    licenseNumber: 'MCI-10011',
    workingHours: { startTime: '08:00', endTime: '14:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
  },
  {
    name: 'Dr. Sanjay Reddy',
    email: 'sanjay.reddy@ambula.com',
    phone: '+91 98450 32334',
    specialization: 'Cardiology',
    location: 'Banashankari, Bengaluru',
    consultationFee: 1000,
    experience: 7,
    languages: ['English', 'Telugu', 'Kannada'],
    bio: 'Cardiologist focused on early detection of cardiovascular risk factors.',
    licenseNumber: 'MCI-10012',
    workingHours: { startTime: '10:00', endTime: '16:00', daysOfWeek: [0, 1, 2, 3, 4] },
  },

  // ───────────────────────── Mumbai ─────────────────────────
  {
    name: 'Dr. Aditi Deshmukh',
    email: 'aditi.deshmukh@ambula.com',
    phone: '+91 98200 11122',
    specialization: 'General',
    location: 'Andheri West, Mumbai',
    consultationFee: 550,
    experience: 9,
    languages: ['English', 'Hindi', 'Marathi'],
    bio: 'Family medicine practitioner providing comprehensive primary care for all ages.',
    licenseNumber: 'MCI-20001',
    workingHours: { startTime: '09:00', endTime: '17:00', daysOfWeek: [0, 1, 2, 3, 4, 5] },
  },
  {
    name: 'Dr. Rahul Bhatt',
    email: 'rahul.bhatt@ambula.com',
    phone: '+91 98200 22233',
    specialization: 'Cardiology',
    location: 'Bandra, Mumbai',
    consultationFee: 1800,
    experience: 20,
    languages: ['English', 'Hindi', 'Gujarati'],
    bio: 'Interventional cardiologist with two decades of experience in angioplasty and cardiac care.',
    licenseNumber: 'MCI-20002',
    workingHours: { startTime: '11:00', endTime: '19:00', daysOfWeek: [1, 2, 3, 4, 5] },
  },
  {
    name: 'Dr. Sneha Pillai',
    email: 'sneha.pillai@ambula.com',
    phone: '+91 98200 33344',
    specialization: 'Dermatology',
    location: 'Powai, Mumbai',
    consultationFee: 950,
    experience: 5,
    languages: ['English', 'Hindi', 'Marathi'],
    bio: 'Cosmetic and clinical dermatologist treating acne, pigmentation, and hair fall.',
    licenseNumber: 'MCI-20003',
    workingHours: { startTime: '12:00', endTime: '20:00', daysOfWeek: [1, 2, 3, 4, 5, 6] },
  },
  {
    name: 'Dr. Imran Sheikh',
    email: 'imran.sheikh@ambula.com',
    phone: '+91 98200 44455',
    specialization: 'Orthopedics',
    location: 'Dadar, Mumbai',
    consultationFee: 1100,
    experience: 13,
    languages: ['English', 'Hindi', 'Urdu'],
    bio: 'Orthopedic specialist focused on knee and hip replacement surgeries.',
    licenseNumber: 'MCI-20004',
    workingHours: { startTime: '09:00', endTime: '15:00', daysOfWeek: [0, 1, 2, 3, 4] },
  },

  // ───────────────────────── Delhi NCR ─────────────────────────
  {
    name: 'Dr. Pooja Malhotra',
    email: 'pooja.malhotra@ambula.com',
    phone: '+91 98100 11133',
    specialization: 'Pediatrics',
    location: 'Saket, Delhi',
    consultationFee: 700,
    experience: 10,
    languages: ['English', 'Hindi', 'Punjabi'],
    bio: 'Pediatrician specializing in newborn care, immunization, and developmental milestones.',
    licenseNumber: 'MCI-30001',
    workingHours: { startTime: '08:00', endTime: '14:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
  },
  {
    name: 'Dr. Aman Gupta',
    email: 'aman.gupta@ambula.com',
    phone: '+91 98100 22244',
    specialization: 'Neurology',
    location: 'Connaught Place, Delhi',
    consultationFee: 1700,
    experience: 19,
    languages: ['English', 'Hindi'],
    bio: 'Senior neurologist specializing in stroke management and neurodegenerative disorders.',
    licenseNumber: 'MCI-30002',
    workingHours: { startTime: '10:00', endTime: '16:00', daysOfWeek: [1, 2, 3, 4, 5] },
  },
  {
    name: 'Dr. Ritika Sethi',
    email: 'ritika.sethi@ambula.com',
    phone: '+91 98100 33355',
    specialization: 'Gynecology',
    location: 'Dwarka, Delhi',
    consultationFee: 1000,
    experience: 12,
    languages: ['English', 'Hindi'],
    bio: 'Gynecologist and obstetrician with a focus on high-risk pregnancy care.',
    licenseNumber: 'MCI-30003',
    workingHours: { startTime: '09:00', endTime: '17:00', daysOfWeek: [0, 1, 2, 3, 4, 5] },
  },
  {
    name: 'Dr. Vivek Chaudhary',
    email: 'vivek.chaudhary@ambula.com',
    phone: '+91 98100 44466',
    specialization: 'Gastroenterology',
    location: 'Noida, Delhi NCR',
    consultationFee: 1250,
    experience: 14,
    languages: ['English', 'Hindi'],
    bio: 'Gastroenterologist treating IBS, ulcers, and chronic liver disease.',
    licenseNumber: 'MCI-30004',
    workingHours: { startTime: '10:00', endTime: '18:00', daysOfWeek: [0, 1, 2, 3, 4] },
  },

  // ───────────────────────── Hyderabad ─────────────────────────
  {
    name: 'Dr. Srinivas Rao',
    email: 'srinivas.rao@ambula.com',
    phone: '+91 90000 11177',
    specialization: 'General',
    location: 'Banjara Hills, Hyderabad',
    consultationFee: 500,
    experience: 11,
    languages: ['English', 'Telugu', 'Hindi'],
    bio: 'General physician offering routine checkups, diabetes, and hypertension management.',
    licenseNumber: 'MCI-40001',
    workingHours: { startTime: '08:00', endTime: '13:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
  },
  {
    name: 'Dr. Anjali Reddy',
    email: 'anjali.reddy@ambula.com',
    phone: '+91 90000 22288',
    specialization: 'Psychiatry',
    location: 'Gachibowli, Hyderabad',
    consultationFee: 1300,
    experience: 8,
    languages: ['English', 'Telugu', 'Hindi'],
    bio: 'Psychiatrist specializing in adolescent mental health and workplace stress.',
    licenseNumber: 'MCI-40002',
    workingHours: { startTime: '12:00', endTime: '19:00', daysOfWeek: [1, 2, 3, 4, 5] },
  },
  {
    name: 'Dr. Farhan Ahmed',
    email: 'farhan.ahmed@ambula.com',
    phone: '+91 90000 33399',
    specialization: 'ENT',
    location: 'Secunderabad, Hyderabad',
    consultationFee: 650,
    experience: 6,
    languages: ['English', 'Hindi', 'Urdu', 'Telugu'],
    bio: 'ENT surgeon treating chronic sinusitis, tonsil issues, and hearing loss.',
    licenseNumber: 'MCI-40003',
    workingHours: { startTime: '09:00', endTime: '17:00', daysOfWeek: [0, 1, 2, 3, 4] },
  },

  // ───────────────────────── Chennai ─────────────────────────
  {
    name: 'Dr. Kavitha Subramaniam',
    email: 'kavitha.subramaniam@ambula.com',
    phone: '+91 94440 11100',
    specialization: 'Dermatology',
    location: 'T Nagar, Chennai',
    consultationFee: 750,
    experience: 9,
    languages: ['English', 'Tamil'],
    bio: 'Dermatologist treating eczema, psoriasis, and skin infections.',
    licenseNumber: 'MCI-50001',
    workingHours: { startTime: '10:00', endTime: '18:00', daysOfWeek: [0, 1, 2, 3, 4, 5] },
  },
  {
    name: 'Dr. Mohan Krishnan',
    email: 'mohan.krishnan@ambula.com',
    phone: '+91 94440 22211',
    specialization: 'Cardiology',
    location: 'Adyar, Chennai',
    consultationFee: 1400,
    experience: 17,
    languages: ['English', 'Tamil', 'Telugu'],
    bio: 'Cardiologist with expertise in preventive cardiology and lipid management.',
    licenseNumber: 'MCI-50002',
    workingHours: { startTime: '09:00', endTime: '15:00', daysOfWeek: [1, 2, 3, 4, 5] },
  },
  {
    name: 'Dr. Geetha Raman',
    email: 'geetha.raman@ambula.com',
    phone: '+91 94440 33322',
    specialization: 'Pediatrics',
    location: 'Velachery, Chennai',
    consultationFee: 600,
    experience: 7,
    languages: ['English', 'Tamil'],
    bio: 'Pediatrician focused on child nutrition and common childhood illnesses.',
    licenseNumber: 'MCI-50003',
    workingHours: { startTime: '08:00', endTime: '14:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
  },

  // ───────────────────────── Pune ─────────────────────────
  {
    name: 'Dr. Nikhil Joshi',
    email: 'nikhil.joshi@ambula.com',
    phone: '+91 98220 11144',
    specialization: 'Orthopedics',
    location: 'Kothrud, Pune',
    consultationFee: 900,
    experience: 8,
    languages: ['English', 'Hindi', 'Marathi'],
    bio: 'Orthopedic doctor specializing in sports injuries and physiotherapy-guided recovery.',
    licenseNumber: 'MCI-60001',
    workingHours: { startTime: '10:00', endTime: '18:00', daysOfWeek: [0, 1, 2, 3, 4, 5] },
  },
  {
    name: 'Dr. Swati Kulkarni',
    email: 'swati.kulkarni@ambula.com',
    phone: '+91 98220 22255',
    specialization: 'Gynecology',
    location: 'Viman Nagar, Pune',
    consultationFee: 850,
    experience: 10,
    languages: ['English', 'Marathi', 'Hindi'],
    bio: 'Gynecologist providing fertility counseling, prenatal, and postnatal care.',
    licenseNumber: 'MCI-60002',
    workingHours: { startTime: '11:00', endTime: '19:00', daysOfWeek: [1, 2, 3, 4, 5, 6] },
  },
  {
    name: 'Dr. Tushar Patil',
    email: 'tushar.patil@ambula.com',
    phone: '+91 98220 33366',
    specialization: 'Gastroenterology',
    location: 'Hinjewadi, Pune',
    consultationFee: 1150,
    experience: 9,
    languages: ['English', 'Marathi', 'Hindi'],
    bio: 'Gastroenterologist specializing in endoscopy and digestive health management.',
    licenseNumber: 'MCI-60003',
    workingHours: { startTime: '09:00', endTime: '14:00', daysOfWeek: [0, 1, 2, 3, 4] },
  },
  {
    name: 'Dr. Yamini Deshpande',
    email: 'yamini.deshpande@ambula.com',
    phone: '+91 98220 44477',
    specialization: 'Neurology',
    location: 'Baner, Pune',
    consultationFee: 1450,
    experience: 13,
    languages: ['English', 'Marathi', 'Hindi'],
    bio: 'Neurologist managing epilepsy, migraines, and peripheral neuropathy.',
    licenseNumber: 'MCI-60004',
    workingHours: { startTime: '10:00', endTime: '17:00', daysOfWeek: [1, 2, 3, 4, 5] },
  },

  // ───────────────────────── Kolkata ─────────────────────────
  {
    name: 'Dr. Subhashree Ghosh',
    email: 'subhashree.ghosh@ambula.com',
    phone: '+91 98300 11188',
    specialization: 'General',
    location: 'Salt Lake, Kolkata',
    consultationFee: 400,
    experience: 5,
    languages: ['English', 'Bengali', 'Hindi'],
    bio: 'General physician for everyday ailments, fever, and seasonal infections.',
    licenseNumber: 'MCI-70001',
    workingHours: { startTime: '17:00', endTime: '21:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
  },
  {
    name: 'Dr. Debashish Roy',
    email: 'debashish.roy@ambula.com',
    phone: '+91 98300 22299',
    specialization: 'ENT',
    location: 'Park Street, Kolkata',
    consultationFee: 750,
    experience: 15,
    languages: ['English', 'Bengali', 'Hindi'],
    bio: 'Senior ENT consultant treating chronic ear infections and voice disorders.',
    licenseNumber: 'MCI-70002',
    workingHours: { startTime: '10:00', endTime: '16:00', daysOfWeek: [0, 1, 2, 3, 4] },
  },
  {
    name: 'Dr. Mitali Sarkar',
    email: 'mitali.sarkar@ambula.com',
    phone: '+91 98300 33300',
    specialization: 'Psychiatry',
    location: 'Ballygunge, Kolkata',
    consultationFee: 1050,
    experience: 6,
    languages: ['English', 'Bengali'],
    bio: 'Psychiatrist focused on anxiety disorders, OCD, and cognitive behavioral therapy.',
    licenseNumber: 'MCI-70003',
    workingHours: { startTime: '13:00', endTime: '20:00', daysOfWeek: [1, 2, 3, 4, 5, 6] },
    isAvailable: false, // example of a doctor temporarily unavailable (e.g. on leave)
  },
];

const DEFAULT_PASSWORD = 'Doctor@123';

// 30-min slot times within a working window
function generateTimes(start, end) {
  const times = [];
  let [h, m] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  while (h < endH || (h === endH && m < endM)) {
    times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += 30;
    if (m >= 60) { m -= 60; h += 1; }
  }
  return times;
}

function addMinutes(time, mins) {
  let [h, m] = time.split(':').map(Number);
  m += mins;
  if (m >= 60) { m -= 60; h += 1; }
  if (h >= 24) h -= 24;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

async function seed() {
  const reset = process.argv.includes('--reset');
  await connectDB();

  if (reset) {
    console.log('Resetting existing seeded doctor data...');
    const emails = SAMPLE_DOCTORS.map((d) => d.email);
    const users = await User.find({ email: { $in: emails } });
    const userIds = users.map((u) => u._id);
    const doctors = await Doctor.find({ userId: { $in: userIds } });
    const doctorIds = doctors.map((d) => d._id);

    await Slot.deleteMany({ doctorId: { $in: doctorIds } });
    await Doctor.deleteMany({ userId: { $in: userIds } });
    await User.deleteMany({ _id: { $in: userIds } });
    console.log(`Removed ${doctors.length} doctor profile(s) and their slots.`);
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  let created = 0;
  let skipped = 0;

  for (const doc of SAMPLE_DOCTORS) {
    let user = await User.findOne({ email: doc.email });

    if (!user) {
      user = await User.create({
        name: doc.name,
        email: doc.email,
        password: hashedPassword,
        role: 'doctor',
        phone: doc.phone,
        language: doc.languages[0],
      });
    }

    let doctor = await Doctor.findOne({ userId: user._id });
    if (doctor) {
      skipped++;
      console.log(`Skipped (already exists): ${doc.name}`);
      continue;
    }

    doctor = await Doctor.create({
      userId: user._id,
      specialization: doc.specialization,
      qualifications: [{ degree: 'MBBS', institution: 'Bangalore Medical College', year: 2024 - doc.experience - 5 }],
      licenseNumber: doc.licenseNumber,
      consultationFee: doc.consultationFee,
      bio: doc.bio,
      experience: doc.experience,
      location: doc.location,
      languages: doc.languages,
      workingHours: doc.workingHours,
      averageRating: Math.round((3.8 + Math.random() * 1.2) * 10) / 10,
      totalReviews: Math.floor(20 + Math.random() * 180),
      isAvailable: doc.isAvailable !== undefined ? doc.isAvailable : true,
    });

    // Create slots for the next 7 days based on working hours
    const times = generateTimes(doc.workingHours.startTime, doc.workingHours.endTime);
    const today = new Date();
    let slotsCreated = 0;

    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      date.setHours(0, 0, 0, 0);

      // Convert Sunday=0..Saturday=6 (JS) to Monday=0..Sunday=6 used in workingHours.daysOfWeek
      const jsDay = date.getDay(); // 0=Sun..6=Sat
      const mondayIndexedDay = (jsDay + 6) % 7; // 0=Mon..6=Sun

      if (!doc.workingHours.daysOfWeek.includes(mondayIndexedDay)) continue;

      for (const startTime of times) {
        await Slot.create({
          doctorId: doctor._id,
          date,
          startTime,
          endTime: addMinutes(startTime, 30),
          status: 'available',
          consultationType: 'both',
        });
        slotsCreated++;
      }
    }

    created++;
    console.log(`Created: ${doc.name} (${doc.specialization}, ${doc.location}) — ${slotsCreated} slots`);
  }

  console.log('\n--- Seed summary ---');
  console.log(`Created: ${created} doctor(s)`);
  console.log(`Skipped: ${skipped} doctor(s) (already existed)`);
  console.log(`Default password for all seeded doctor accounts: ${DEFAULT_PASSWORD}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
