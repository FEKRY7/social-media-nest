import { Injectable } from '@nestjs/common';
import { Model, Query } from 'mongoose';

@Injectable()
export class ApiFeatures<T> {
  public mongooseQuery: Query<T[], T>;
  public queryData: any;

  constructor(mongooseQuery: Query<T[], T>, queryData: any) {
    this.mongooseQuery = mongooseQuery;
    this.queryData = queryData;
  }

  async pagination(model: Model<T>): Promise<this> {
    let page = Number(this.queryData.page) || 1;
    let size = Number(this.queryData.size) || 5;
    let skip = size * (page - 1);

    this.mongooseQuery.skip(skip).limit(size);

    const totalCount = await model.countDocuments();
    this.queryData.totalCount = totalCount;
    this.queryData.totalPages = Math.ceil(totalCount / size);
    this.queryData.next = this.queryData.totalPages > page ? page + 1 : null;
    this.queryData.previous = page > 1 ? page - 1 : null;
    this.queryData.currentPage = page;
    this.queryData.resultsPerPage = size;

    return this;
  }

  filter(): this {
    const excludedFields = ['sort', 'page', 'size', 'fields', 'searchKey'];
    let queryCopy = { ...this.queryData };

    excludedFields.forEach((field) => delete queryCopy[field]);


    queryCopy = JSON.parse(
      JSON.stringify(queryCopy).replace(/lt|lte|gt|gte/g, (match) => `$${match}`)
    );

    this.mongooseQuery.find(queryCopy);
    return this;
  }

  sort(): this {
    if (this.queryData.sort) {
      this.mongooseQuery.sort(this.queryData.sort.replace(/,/g, ' '));
    }
    return this;
  }

  search(): this {
    if (this.queryData.searchKey) {
      this.mongooseQuery.find({
        $or: [
          { name: { $regex: this.queryData.searchKey, $options: 'i' } },
          { description: { $regex: this.queryData.searchKey, $options: 'i' } },
        ],
      });
    }
    return this;
  }

  select(): this {
    if (this.queryData.fields) {
      this.mongooseQuery.select(this.queryData.fields.replace(/,/g, ' '));
    }
    return this;
  }
}
