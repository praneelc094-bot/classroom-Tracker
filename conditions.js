// ============================================================
//  Consult Visuals – condition library (orthopedics / physiotherapy)
//
//  DRAFT CONTENT. Every explanation below was written as a starting point and must be checked
//  by a doctor before it is shown to a patient. Doctors can edit the text and must choose and
//  approve an image for each condition in the app; nothing is shown until they have.
//
//  Fields:
//    id          stable id, never change it (saved image choices are keyed by it)
//    name        medical name, shown to the doctor and in small print to the patient
//    plain       what the patient sees as the heading
//    region      body area, used for the filter chips
//    aka         extra search words (other names, common spellings, Hindi words in English letters)
//    text        2–4 short sentences for the patient: what it is, never what to take or do
//    imageQuery  starting search on Wikimedia Commons when the doctor picks an image
// ============================================================

const CONDITIONS = [
  // ---------- Knee ----------
  {
    id: 'acl-tear', name: 'Anterior cruciate ligament (ACL) tear', plain: 'Torn ligament inside the knee', region: 'Knee',
    aka: ['acl', 'cruciate', 'ligament', 'knee twist', 'ghutna', 'ghutne'],
    text: 'The ACL is a strong band in the middle of the knee that stops the shin bone sliding forward. It can tear during a sudden twist or landing, often in sport. The knee may swell and feel unstable or “give way”.',
    imageQuery: 'anterior cruciate ligament knee diagram',
  },
  {
    id: 'meniscus-tear', name: 'Meniscus tear', plain: 'Torn cushion in the knee', region: 'Knee',
    aka: ['meniscus', 'cartilage tear', 'knee locking', 'ghutna'],
    text: 'The menisci are two C-shaped cushions between the thigh bone and shin bone. A twist, or wear over the years, can tear one. This can cause pain, swelling, and a knee that catches or locks.',
    imageQuery: 'knee meniscus anatomy diagram',
  },
  {
    id: 'knee-oa', name: 'Osteoarthritis of the knee', plain: 'Wear and tear of the knee joint', region: 'Knee',
    aka: ['osteoarthritis', 'arthritis', 'oa', 'knee pain old age', 'ghutne ka dard', 'gathiya'],
    text: 'The smooth cartilage that covers the ends of the bones slowly thins out. The bones rub more, so the knee becomes painful, stiff and sometimes swollen, especially after activity.',
    imageQuery: 'knee osteoarthritis diagram',
  },
  {
    id: 'patellofemoral-pain', name: 'Patellofemoral pain syndrome', plain: 'Pain around the kneecap', region: 'Knee',
    aka: ['patella', 'kneecap', 'runners knee', 'anterior knee pain'],
    text: 'The kneecap glides in a groove at the front of the thigh bone. When it is under too much strain, the front of the knee hurts, often on stairs, squatting, or after sitting for a long time.',
    imageQuery: 'patella femur knee anatomy diagram',
  },
  {
    id: 'mcl-sprain', name: 'Medial collateral ligament (MCL) sprain', plain: 'Strained ligament on the inner knee', region: 'Knee',
    aka: ['mcl', 'collateral ligament', 'inner knee', 'sprain'],
    text: 'The MCL runs along the inner side of the knee and keeps it from bending inwards. A blow to the outside of the knee can stretch or tear it, causing pain on the inner side.',
    imageQuery: 'medial collateral ligament knee diagram',
  },

  // ---------- Spine ----------
  {
    id: 'lumbar-disc', name: 'Lumbar disc herniation', plain: 'Slipped disc in the lower back', region: 'Spine',
    aka: ['slip disc', 'slipped disc', 'herniated disc', 'prolapse', 'pivd', 'kamar dard'],
    text: 'Between the bones of the spine are soft discs that act as shock absorbers. The soft centre of a disc can push out and press on a nearby nerve, causing back pain and sometimes pain down the leg.',
    imageQuery: 'herniated disc lumbar diagram',
  },
  {
    id: 'sciatica', name: 'Sciatica (lumbar radiculopathy)', plain: 'Pain travelling down the leg from the back', region: 'Spine',
    aka: ['sciatica', 'sciatic nerve', 'radiculopathy', 'leg pain', 'nas dabna'],
    text: 'The sciatic nerve starts in the lower back and runs down the back of each leg. When something presses on its roots, pain, tingling or numbness can travel from the buttock down the leg.',
    imageQuery: 'sciatic nerve diagram',
  },
  {
    id: 'cervical-spondylosis', name: 'Cervical spondylosis', plain: 'Wear and tear in the neck', region: 'Spine',
    aka: ['spondylosis', 'cervical', 'neck pain', 'gardan dard'],
    text: 'With age, the discs and joints in the neck slowly wear. This can make the neck stiff and painful, and sometimes a nerve gets pressed, giving pain or tingling in the shoulder or arm.',
    imageQuery: 'cervical spine vertebrae diagram',
  },
  {
    id: 'back-strain', name: 'Lumbar muscle strain', plain: 'Strained muscles in the lower back', region: 'Spine',
    aka: ['back strain', 'muscle pull', 'catch in back', 'kamar mein moch'],
    text: 'The muscles and tissues that support the lower back can be overstretched by lifting, bending or a sudden movement. The back feels sore and stiff, but the bones and nerves are not damaged.',
    imageQuery: 'lower back muscles anatomy',
  },
  {
    id: 'spinal-stenosis', name: 'Lumbar spinal stenosis', plain: 'Narrowing of the spinal canal', region: 'Spine',
    aka: ['stenosis', 'canal narrowing', 'claudication'],
    text: 'The spinal canal is the tunnel that carries the nerves down the back. If it narrows, the nerves get squeezed, which can cause pain, heaviness or numbness in the legs when walking or standing.',
    imageQuery: 'spinal stenosis diagram',
  },

  // ---------- Shoulder ----------
  {
    id: 'rotator-cuff-tear', name: 'Rotator cuff tear', plain: 'Torn tendon in the shoulder', region: 'Shoulder',
    aka: ['rotator cuff', 'supraspinatus', 'shoulder tendon', 'kandha'],
    text: 'The rotator cuff is a group of four muscles and tendons that hold the top of the arm bone in the shoulder socket. A tendon can tear from injury or wear, making it painful or weak to lift the arm.',
    imageQuery: 'rotator cuff muscles diagram',
  },
  {
    id: 'frozen-shoulder', name: 'Adhesive capsulitis (frozen shoulder)', plain: 'Stiff, frozen shoulder', region: 'Shoulder',
    aka: ['frozen shoulder', 'adhesive capsulitis', 'stiff shoulder', 'kandha jam'],
    text: 'The shoulder joint is wrapped in a soft lining called the capsule. In a frozen shoulder this lining becomes thick and tight, so the shoulder gets painful and very hard to move. It usually improves slowly over months.',
    imageQuery: 'shoulder joint capsule diagram',
  },
  {
    id: 'shoulder-dislocation', name: 'Anterior shoulder dislocation', plain: 'Shoulder out of its socket', region: 'Shoulder',
    aka: ['dislocation', 'shoulder out', 'subluxation', 'kandha utarna'],
    text: 'The shoulder is a ball-and-socket joint. A fall or forceful movement can push the ball out of the shallow socket, usually forwards. It is very painful until it is put back in place.',
    imageQuery: 'shoulder dislocation diagram',
  },
  {
    id: 'shoulder-impingement', name: 'Subacromial impingement', plain: 'Pinched tendon in the shoulder', region: 'Shoulder',
    aka: ['impingement', 'bursitis', 'subacromial', 'painful arc'],
    text: 'When the arm is raised, the shoulder tendons pass through a narrow space under the bony tip of the shoulder. If that space is tight or the tendons are irritated, lifting the arm overhead becomes painful.',
    imageQuery: 'shoulder impingement acromion diagram',
  },

  // ---------- Elbow ----------
  {
    id: 'tennis-elbow', name: 'Lateral epicondylitis (tennis elbow)', plain: 'Overused tendon on the outer elbow', region: 'Elbow',
    aka: ['tennis elbow', 'lateral epicondylitis', 'outer elbow pain', 'kohni'],
    text: 'The muscles that bend the wrist back attach to a bony bump on the outside of the elbow. Repeated gripping or lifting can irritate this tendon, making the outer elbow sore when gripping things.',
    imageQuery: 'lateral epicondylitis elbow diagram',
  },

  // ---------- Hand & wrist ----------
  {
    id: 'carpal-tunnel', name: 'Carpal tunnel syndrome', plain: 'Squeezed nerve in the wrist', region: 'Hand & wrist',
    aka: ['carpal tunnel', 'median nerve', 'hand numbness', 'tingling fingers', 'kalai'],
    text: 'The median nerve passes through a narrow tunnel at the front of the wrist. If it gets squeezed, the thumb and first fingers can tingle, feel numb or weak, often worse at night.',
    imageQuery: 'carpal tunnel median nerve diagram',
  },
  {
    id: 'distal-radius-fracture', name: 'Distal radius fracture', plain: 'Broken wrist bone', region: 'Hand & wrist',
    aka: ['wrist fracture', 'colles', 'radius fracture', 'broken wrist', 'haddi tootna'],
    text: 'The radius is the larger of the two forearm bones. Its end near the wrist often breaks when someone falls onto an outstretched hand, causing pain, swelling, and sometimes a bent shape at the wrist.',
    imageQuery: 'distal radius fracture diagram',
  },

  // ---------- Hip ----------
  {
    id: 'hip-oa', name: 'Osteoarthritis of the hip', plain: 'Wear and tear of the hip joint', region: 'Hip',
    aka: ['hip arthritis', 'osteoarthritis', 'hip pain', 'kulha'],
    text: 'The hip is a ball-and-socket joint covered by smooth cartilage. When the cartilage wears thin, the joint becomes painful and stiff, often felt in the groin, and it may become harder to walk or put on shoes.',
    imageQuery: 'hip joint osteoarthritis diagram',
  },

  // ---------- Foot & ankle ----------
  {
    id: 'ankle-sprain', name: 'Lateral ankle sprain', plain: 'Twisted ankle (stretched ligament)', region: 'Foot & ankle',
    aka: ['ankle sprain', 'twisted ankle', 'atfl', 'moch', 'pair mudna'],
    text: 'Ligaments on the outside of the ankle hold the bones together. When the foot rolls inwards, these ligaments can stretch or tear, causing pain, swelling and bruising on the outer ankle.',
    imageQuery: 'ankle ligaments lateral diagram',
  },
  {
    id: 'plantar-fasciitis', name: 'Plantar fasciitis', plain: 'Heel pain from the sole’s tissue band', region: 'Foot & ankle',
    aka: ['plantar fasciitis', 'heel pain', 'heel spur', 'edi dard'],
    text: 'The plantar fascia is a thick band under the foot that supports the arch. When it is overloaded it becomes sore where it joins the heel. The pain is often worst with the first steps in the morning.',
    imageQuery: 'plantar fascia foot diagram',
  },
  {
    id: 'achilles-tendinopathy', name: 'Achilles tendinopathy', plain: 'Overused tendon at the back of the heel', region: 'Foot & ankle',
    aka: ['achilles', 'tendinitis', 'heel cord'],
    text: 'The Achilles tendon connects the calf muscles to the heel bone. Too much load can make it thick, stiff and painful, especially when starting to walk or run.',
    imageQuery: 'achilles tendon anatomy diagram',
  },

  // ---------- Bone health ----------
  {
    id: 'osteoporosis', name: 'Osteoporosis', plain: 'Thin, weaker bones', region: 'Bone health',
    aka: ['osteoporosis', 'bone density', 'weak bones', 'kamzor haddi'],
    text: 'Bones are constantly rebuilt inside. In osteoporosis more bone is lost than made, so bones become thinner and more likely to break, often in the wrist, hip or spine, even after a small fall.',
    imageQuery: 'osteoporosis bone comparison',
  },
];
