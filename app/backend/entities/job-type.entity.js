"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobType = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const job_entity_1 = require("./job.entity");
let JobType = class JobType extends base_entity_1.BaseEntity {
};
exports.JobType = JobType;
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], JobType.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], JobType.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], JobType.prototype, "base_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 1 }),
    __metadata("design:type", Number)
], JobType.prototype, "base_hours", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 7, default: '#3B82F6' }) // Default blue color
    ,
    __metadata("design:type", String)
], JobType.prototype, "color_hex", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => job_entity_1.Job, job => job.job_type),
    __metadata("design:type", Array)
], JobType.prototype, "jobs", void 0);
exports.JobType = JobType = __decorate([
    (0, typeorm_1.Entity)('job_types')
], JobType);
//# sourceMappingURL=job-type.entity.js.map