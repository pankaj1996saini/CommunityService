// Fills the database with demo accounts and a handful of complaints.
// Careful: it wipes users, complaints, notifications and counters first.

const mongoose = require('mongoose');
const config = require('./config');
const User = require('./models/User');
const Complaint = require('./models/Complaint');
const Notification = require('./models/Notification');
const Counter = require('./models/Counter');
const { nextTicketId } = require('./utils/ticket');

const daysAgo = (d, hours = 0) => new Date(Date.now() - d * 864e5 - hours * 36e5);

async function run() {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
  await Promise.all([User.deleteMany({}), Complaint.deleteMany({}), Notification.deleteMany({}), Counter.deleteMany({})]);

  // .create() one by one so the password hook runs
  const admin = await User.create({ name: 'Priya Nair', email: 'admin@community.test', password: 'Admin@123', role: 'admin', phone: '9876500001' });
  const ravi = await User.create({ name: 'Ravi Kumar', email: 'ravi@community.test', password: 'Staff@123', role: 'staff', department: 'Plumbing', phone: '9876500002' });
  const meena = await User.create({ name: 'Meena Iyer', email: 'meena@community.test', password: 'Staff@123', role: 'staff', department: 'Electrical', phone: '9876500003' });
  const joseph = await User.create({ name: 'Joseph D\'Souza', email: 'joseph@community.test', password: 'Staff@123', role: 'staff', department: 'General maintenance', phone: '9876500004' });
  const asha = await User.create({ name: 'Asha Verma', email: 'asha@community.test', password: 'User@123', unit: 'Block A, 204', phone: '9876500005' });
  const kiran = await User.create({ name: 'Kiran Shah', email: 'kiran@community.test', password: 'User@123', unit: 'Block C, 101', phone: '9876500006' });

  const step = (by, status, note, at) => ({ status, note, by: by._id, byName: by.name, byRole: by.role, at });

  // each entry: who raised it, what, and how far along it is
  const specs = [
    {
      by: asha, title: 'Water leaking from bathroom ceiling', category: 'Water', location: 'Block A, 204 - bathroom',
      description: 'There is a steady drip from the ceiling above the shower. It started two days ago and the patch is getting bigger.',
      priority: 'High', age: 6, flow: 'resolved', staff: ravi, rating: 5, comment: 'Fixed the same day, very polite.',
    },
    {
      by: asha, title: 'Corridor light not working', category: 'Electrical', location: 'Block A, 2nd floor corridor',
      description: 'The tube light near the staircase has been flickering for a week and is now completely off. It is very dark at night.',
      priority: 'Medium', age: 3, flow: 'progress', staff: meena,
    },
    {
      by: asha, title: 'Broken gate latch at the main entrance', category: 'Security', location: 'Main gate',
      description: 'The side gate does not lock anymore, anyone can walk in after 10 pm. Needs to be fixed soon.',
      priority: 'Urgent', age: 1, flow: 'assigned', staff: joseph,
    },
    {
      by: kiran, title: 'Garbage not collected for three days', category: 'Sanitation', location: 'Block C, bin area',
      description: 'The bins behind Block C are overflowing and the smell is spreading to the ground floor flats.',
      priority: 'High', age: 2, flow: 'open',
    },
    {
      by: kiran, title: 'Lift stops between floors', category: 'Infrastructure', location: 'Block C lift',
      description: 'The lift jerks and stops for a few seconds between the 3rd and 4th floor. Elderly residents are scared to use it.',
      priority: 'Urgent', age: 5, flow: 'progress', staff: joseph,
    },
    {
      by: kiran, title: 'Tap in common washroom keeps running', category: 'Water', location: 'Community hall washroom',
      description: 'The second tap in the washroom does not close properly and wastes a lot of water.',
      priority: 'Low', age: 9, flow: 'resolved', staff: ravi, rating: 4, comment: '',
    },
    {
      by: asha, title: 'Pothole near visitor parking', category: 'Infrastructure', location: 'Visitor parking entrance',
      description: 'A deep pothole has formed right at the entrance of the visitor parking. Two-wheelers are skidding on it.',
      priority: 'Medium', age: 0, flow: 'open',
    },
    {
      by: kiran, title: 'Socket sparks when plugging in a charger', category: 'Electrical', location: 'Block C, 101 - living room',
      description: 'The wall socket near the TV sparks every time I plug something in. I have stopped using it but it needs checking.',
      priority: 'High', age: 4, flow: 'resolved', staff: meena, rating: 5, comment: 'Replaced the whole socket.',
    },
  ];

  for (const s of specs) {
    const created = daysAgo(s.age, 2);
    const timeline = [step(s.by, 'Open', 'Complaint submitted', created)];
    const doc = {
      ticketId: await nextTicketId(),
      title: s.title,
      description: s.description,
      category: s.category,
      location: s.location,
      priority: s.priority,
      createdBy: s.by._id,
      createdAt: created,
      status: 'Open',
    };

    if (s.staff) {
      doc.assignedTo = s.staff._id;
      doc.status = 'Assigned';
      timeline.push(step(admin, 'Assigned', `Assigned to ${s.staff.name} (${s.staff.department})`, new Date(created.getTime() + 36e5)));
    }
    if (s.flow === 'progress' || s.flow === 'resolved') {
      doc.status = 'In Progress';
      timeline.push(step(s.staff, 'In Progress', 'Task accepted, work started', new Date(created.getTime() + 3 * 36e5)));
    }
    if (s.flow === 'progress') {
      timeline.push(step(s.staff, 'In Progress', 'Checked the issue on site, waiting for a spare part', new Date(created.getTime() + 20 * 36e5)));
    }
    if (s.flow === 'resolved') {
      doc.status = 'Resolved';
      doc.resolvedAt = new Date(created.getTime() + 26 * 36e5);
      timeline.push(step(s.staff, 'Resolved', 'Repaired and tested, all good now', doc.resolvedAt));
      doc.feedback = { rating: s.rating, comment: s.comment, at: new Date(doc.resolvedAt.getTime() + 36e5) };
    }

    doc.timeline = timeline;
    await Complaint.create(doc);
  }

  // a couple of notifications so the bell isn't empty on first launch
  const open = await Complaint.findOne({ status: 'Assigned' });
  const unassigned = await Complaint.findOne({ status: 'Open', assignedTo: null }).sort({ createdAt: -1 });
  await Notification.create([
    { user: admin._id, title: 'New complaint', message: `${unassigned.ticketId}: ${unassigned.title} (${unassigned.category})`, complaint: unassigned._id },
    { user: joseph._id, title: 'New task assigned', message: `${open.ticketId}: ${open.title}`, complaint: open._id },
    { user: asha._id, title: 'Your complaint was assigned', message: `${open.ticketId} is now with Joseph D'Souza.`, complaint: open._id },
  ]);

  console.log('Seeded. Demo logins:');
  console.log('  admin  admin@community.test  / Admin@123');
  console.log('  staff  ravi@community.test   / Staff@123   (also meena@, joseph@)');
  console.log('  user   asha@community.test   / User@123    (also kiran@)');

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Seeding failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
