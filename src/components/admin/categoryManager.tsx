"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import React, { useState } from "react";
import { addNewCategory, deleteCategory } from "@/actions/adminActions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

type Category = {
  id: number;
  name: string;
  createdAt: Date;
};
interface CategoryManagerProps {
  categories: Category[];
}

const CategoryManager = ({
  categories: initialCategories,
}: CategoryManagerProps) => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleAddNewCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", newCategoryName);
      const result = await addNewCategory(formData);
      if (result.success) {
        const newCategory = {
          id: Math.max(0, ...categories.map((c) => c.id)) + 1,
          name: newCategoryName,
          createdAt: new Date(),
        };
        setCategories([...categories, newCategory]);
        setNewCategoryName("");
      }else{
        alert(result.message)
      }
    } catch (error) {
      console.log(error,"adding error");
    }
  };

  async function handleDeleteCategory(id:number) {
    const result = await deleteCategory(id)
    if (result.success) {
        setCategories(categories.filter(c => c.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddNewCategory} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="categoryName">New category</Label>
          <div className="flex gap-2">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              id="categoryName"
              placeholder="Enter category"
            />
            <Button
              type="submit"
              className="cursor-pointer bg-teal-500 hover:bg-teal-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
      </form>
      <div>
        <h3 className="text-lg font-medium mb-4">Categories</h3>
        {categories.length === 0 ? (
          <p>No categories added. Add your first category above.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="font-medium">
                    {new Date(category.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button onClick={()=>handleDeleteCategory(category.id)} variant={'ghost'} size={'icon'}>
                        <Trash2 className="h-5 w-5 text-red-500"/>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};
export default CategoryManager;
