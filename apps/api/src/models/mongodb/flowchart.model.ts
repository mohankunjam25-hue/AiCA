import mongoose, { Schema, Document } from 'mongoose';
import { FlowchartGraph, FlowchartNode, FlowchartEdge } from '@aica/shared';

export interface FlowchartDocument extends Omit<FlowchartGraph, 'id'>, Document {}

const FlowchartNodeSchema = new Schema<FlowchartNode>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['start', 'end', 'input', 'output', 'process', 'decision'],
      required: true,
    },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
    data: {
      label: { type: String },
      assignments: [{ type: String }],
      condition: { type: String },
      inputVariables: [{ type: String }],
      outputExpression: { type: String },
      comment: { type: String },
    },
  },
  { _id: false }
);

const FlowchartEdgeSchema = new Schema<FlowchartEdge>(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    sourceHandle: { type: String },
    targetHandle: { type: String },
    label: { type: String },
  },
  { _id: false }
);

const FlowchartSchema = new Schema<FlowchartDocument>(
  {
    problemId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    version: { type: Number, default: 1 },
    nodes: [FlowchartNodeSchema],
    edges: [FlowchartEdgeSchema],
    viewport: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      zoom: { type: Number, default: 1 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound unique index so each user has one persisted flowchart per problem
FlowchartSchema.index({ problemId: 1, userId: 1 }, { unique: true });

export const FlowchartModel = mongoose.model<FlowchartDocument>(
  'Flowchart',
  FlowchartSchema
);
