import { Response } from "express";

export interface CustomResponse extends Response<{ message: string, [key: string]: any }> { }