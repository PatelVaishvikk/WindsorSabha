import type { Database, Member } from "../../lib/types";
const oid = (n: number) => n.toString(16).padStart(24, "0");
export function sampleData(): Database {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  const today = now.toISOString().slice(0, 10);
  const day = (offset: number) => {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  const mandals = [
    { _id: oid(1), name: "Windsor" },
    { _id: oid(2), name: "LaSalle" },
    { _id: oid(3), name: "Tecumseh" },
  ];
  const names = [
    "Aarav Patel",
    "Dhruv Shah",
    "Harsh Patel",
    "Krish Desai",
    "Meet Patel",
    "Neel Shah",
    "Om Trivedi",
    "Parth Mehta",
    "Rishi Patel",
    "Yash Joshi",
    "Dev Shah",
    "Jay Patel",
    "Kush Patel",
    "Manav Desai",
    "Nisarg Shah",
    "Pranav Patel",
    "Rohan Mehta",
    "Sahil Patel",
    "Tejas Shah",
    "Vivek Patel",
    "Akshar Desai",
    "Darsh Patel",
    "Het Shah",
    "Ishan Patel",
  ];
  const members: Member[] = names.map((fullName, i) => ({
    _id: oid(100 + i),
    fullName,
    dob: `${1998 + (i % 7)}-05-${String(i + 1).padStart(2, "0")}`,
    mandal: mandals[i < 14 ? 0 : i < 20 ? 1 : 2]._id,
    contactNumber: `519-555-${String(100 + i).padStart(4, "0")}`,
    email:
      fullName.toLowerCase().replace("", "").replace(" ", ".") + "@example.com",
    studyStatus: i % 3 === 0 ? "Graduated" : "Student",
    institution: i % 3 === 0 ? "" : "University of Windsor",
    courseName: i % 3 === 0 ? "" : "Computer Science",
    yearOfStudy: i % 3 === 0 ? "" : "2",
    jobStatus: i % 3 === 0 ? "Full-Time" : "Student",
    employer: i % 3 === 0 ? "Local business" : "",
    jobTitle: i % 3 === 0 ? "Associate" : "",
    partTimeJob: false,
    partTimeJobDetails: { employer: "", hoursPerWeek: 0 },
    immigrationStatus:
      i % 3 === 0 ? "PR" : i % 3 === 1 ? "Study Permit" : "Citizen",
    indiaLocation: {
      state: "Gujarat",
      city: i % 2 ? "Ahmedabad" : "Vadodara",
      village: "",
    },
    currentCanadaLocation: { city: "Windsor", province: "Ontario" },
    joinedDate: day(-180 - i * 3),
    isActive: i !== 23,
    notes: "",
  }));
  const inventory = [
    ["Basmati rice", "Grains", "kg", 18, 5, 3.8],
    ["Toor dal", "Pulses", "kg", 2, 4, 4.5],
    ["Wheat flour", "Grains", "kg", 12, 5, 2.2],
    ["Cooking oil", "Oil", "liter", 1.5, 3, 4],
    ["Potatoes", "Vegetables", "kg", 8, 3, 1.8],
    ["Tomatoes", "Vegetables", "kg", 1, 2, 3.5],
    ["Milk", "Dairy", "liter", 6, 3, 2.1],
    ["Turmeric", "Spices", "kg", 0.8, 0.3, 12],
    ["Cumin seeds", "Spices", "kg", 0.5, 0.2, 15],
    ["Yogurt", "Dairy", "kg", 4, 2, 4.2],
  ].map((r, i) => ({
    _id: oid(200 + i),
    itemName: r[0] as string,
    category: r[1] as string,
    unit: r[2] as string,
    currentStock: r[3] as number,
    reorderThreshold: r[4] as number,
    costPerUnit: r[5] as number,
    lastRestockedDate: day(-8),
  }));
  const dishes = [
    {
      _id: oid(300),
      dishName: "Dal & rice",
      standardIngredients: [
        { item: oid(200), quantityPerServing: 0.1, unit: "kg" },
        { item: oid(201), quantityPerServing: 0.06, unit: "kg" },
      ],
    },
    {
      _id: oid(301),
      dishName: "Potato shaak",
      standardIngredients: [
        { item: oid(204), quantityPerServing: 0.15, unit: "kg" },
        { item: oid(203), quantityPerServing: 0.015, unit: "liter" },
      ],
    },
    {
      _id: oid(302),
      dishName: "Rotli",
      standardIngredients: [
        { item: oid(202), quantityPerServing: 0.08, unit: "kg" },
      ],
    },
  ];
  const sabhas = [0, 1, 2, 3, 4, 5].map((n) => ({
    _id: oid(400 + n),
    date: day(-7 * (n + 1)),
    mandal: mandals[n % 3 === 2 ? 1 : 0]._id,
    attendees: members.slice(0, [21, 18, 22, 17, 20, 16][n]).map((m) => m._id),
    dishesServed: [
      {
        dishName: n % 2 ? "Dal & rice" : "Potato shaak",
        quantityPrepared: 25,
        servingUnit: "servings",
      },
      { dishName: "Rotli", quantityPrepared: 60, servingUnit: "pieces" },
    ],
    ingredientsUsed: [],
    preparedBy: members.slice(0, 3).map((m) => m._id),
    notes: "Weekly youth sabha and mahaprasad.",
  }));
  sabhas.unshift({
    _id: oid(410),
    date: day(7 - now.getUTCDay() || 7),
    mandal: mandals[0]._id,
    attendees: [],
    dishesServed: [
      { dishName: "Dal & rice", quantityPrepared: 30, servingUnit: "servings" },
    ],
    ingredientsUsed: [],
    preparedBy: members.slice(0, 2).map((m) => m._id),
    notes:
      "Weekly youth sabha. Join us for satsang, connection, and mahaprasad.",
  });
  return {
    mandals,
    members,
    inventory,
    dishes,
    sabhas,
    transactions: inventory.map((item, i) => ({
      _id: oid(500 + i),
      itemId: item._id,
      type: "restock",
      quantity: item.currentStock,
      date: day(-8),
      notes: "Opening stock • sample data",
    })),
  };
}
