const { calculateProfileCompletion } = require('../src/utils/profileCompletion');

console.log('--- TESTING PROFILE COMPLETION LOGIC ---');

// Case 1: Null/Guest User
const guestResult = calculateProfileCompletion(null);
console.log('Guest User:', {
  percentage: guestResult.percentage,
  strengthLevel: guestResult.strengthLevel,
  missingCount: guestResult.missingItems.length,
  nextAction: guestResult.nextAction?.actionText,
});
if (guestResult.percentage !== 0) throw new Error('Guest percentage must be 0%');

// Case 2: Tom (from screenshot): Name + Email, but no phone, no bio, no avatar, no city, no social
const tomUser = {
  id: 123,
  username: 'tom',
  name: 'Tom',
  displayName: 'Tom',
  email: 'Tom@thrivingskill.com',
  roles: ['subscriber'],
};
const tomResult = calculateProfileCompletion(tomUser);
console.log('Tom User (from screenshot):', {
  percentage: tomResult.percentage,
  strengthLevel: tomResult.strengthLevel,
  completedItems: tomResult.completedItems.map(i => i.label),
  missingItems: tomResult.missingItems.map(i => i.label),
  nextAction: tomResult.nextAction?.actionText,
});
// Name = 15, Email = 15 => Total = 30%
if (tomResult.percentage !== 30) throw new Error(`Tom percentage expected 30%, got ${tomResult.percentage}%`);
if (tomResult.strengthLevel !== 'beginner') throw new Error(`Tom strength level expected beginner, got ${tomResult.strengthLevel}`);

// Case 3: Complete User
const completeUser = {
  id: 123,
  name: 'Tom Student',
  displayName: 'Tom Student',
  first_name: 'Tom',
  last_name: 'Student',
  email: 'tom@thrivingskill.com',
  phone: '+8801712345678',
  description: 'Senior Software Engineer and lifelong learner passionate about AI and mobile systems.',
  avatar: 'https://thrivingskill.com/wp-content/uploads/avatars/tom.jpg',
  city: 'Dhaka',
  cover_photo: 'https://thrivingskill.com/wp-content/uploads/covers/tom_banner.jpg',
  social: {
    linkedin: 'https://linkedin.com/in/tom',
  },
};
const completeResult = calculateProfileCompletion(completeUser);
console.log('Complete User:', {
  percentage: completeResult.percentage,
  strengthLevel: completeResult.strengthLevel,
  isComplete: completeResult.isComplete,
  completedItems: completeResult.completedItems.map(i => i.label),
  missingCount: completeResult.missingItems.length,
});
if (completeResult.percentage !== 100) throw new Error(`Complete user expected 100%, got ${completeResult.percentage}%`);
if (!completeResult.isComplete) throw new Error('isComplete must be true');
if (completeResult.strengthLevel !== 'all-star') throw new Error('strengthLevel must be all-star');

console.log('--- ALL PROFILE COMPLETION TESTS PASSED ---');
