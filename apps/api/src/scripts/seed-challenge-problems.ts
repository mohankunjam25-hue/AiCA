import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProblemModel } from '../models/mongodb/problem.model.js';
import { allChallengeProblems } from './data/challenge-problems.data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

export async function seedChallengeProblems() {
  console.log('========================================================');
  console.log('🚀 Seeding 41 Ultimate Programming Challenge Problems...');
  console.log('========================================================');

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in environment variables.');
  }

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB Atlas.');

  let upsertedCount = 0;

  for (const p of allChallengeProblems) {
    const doc: any = {
      title: p.title,
      slug: p.slug,
      status: 'PUBLISHED',
      version: p.version || 1,
      difficulty: p.difficulty,
      tags: p.tags,
      description: p.description,
      constraints: p.constraints,
      examples: p.examples,
      timeLimitMs: p.timeLimitMs || 2000,
      memoryLimitKb: p.memoryLimitKb || 262144,
      benchmarks: p.benchmarks,
      starterCode: p.starterCode,
      testCases: p.testCases,
      isCustomPractice: false,
      practiceVisibility: 'CATALOG_APPROVED'
    };

    if (p.functionSignature) {
      doc.functionSignature = p.functionSignature;
    }

    const updateQuery: any = { $set: doc };
    if (!p.functionSignature) {
      updateQuery.$unset = { functionSignature: 1 };
    }

    const res = await ProblemModel.updateOne(
      { slug: p.slug },
      updateQuery,
      { upsert: true }
    );

    if (res.upsertedCount > 0 || res.modifiedCount > 0 || res.matchedCount > 0) {
      upsertedCount++;
    }
    console.log(`  ✓ Synced [${p.difficulty}] ${p.title} (${p.slug})`);
  }

  console.log('--------------------------------------------------------');
  console.log(`🎉 Successfully seeded/updated ${upsertedCount} problems in MongoDB Atlas!`);
  console.log('========================================================');

  await mongoose.disconnect();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedChallengeProblems()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
