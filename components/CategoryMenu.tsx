// *********************
// Role of the component: Category wrapper that will contain title and category items
// Name of the component: CategoryMenu.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <CategoryMenu />
// Input parameters: no input parameters
// Output: section title and category items
// *********************

"use client";

import React from "react";
import CategoryItem from "./CategoryItem";
import Image from "next/image";
import Heading from "./Heading";
import { useEffect, useState } from "react";
import apiClient from "@/lib/api";
import { convertCategoryNameToURLFriendly } from "@/utils/categoryFormating";

const getCategoryIcon = (categoryName: string) => {
  const normalizedName = categoryName.trim().toLowerCase();

  const iconMap: Record<string, string> = {
    cameras: "/camera icon.png",
    computers: "/pc icon.png",
    earbuds: "/ear buds icon.png",
    headphones: "/headphone icon.png",
    juicers: "/icons8-shower-50.png",
    laptops: "/laptop icon.png",
    "mixer-grinders": "/fast shopping icon.png",
    mice: "/mouse icon.png",
    "phone-gimbals": "/drone.png",
    printers: "/printers icon.png",
    "smart phones": "/smart phone icon.png",
    "smart-phones": "/smart phone icon.png",
    "smart watches": "/smart watch.png",
    "smart-watches": "/smart watch.png",
    speakers: "/sony speaker image.png",
    tablets: "/tablet icon.png",
    trimmers: "/support icon.png",
    watches: "/watch for banner.png",
  };

  return iconMap[normalizedName] || "/product_placeholder.jpg";
};

const CategoryMenu = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get("/api/categories");
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="py-10 bg-blue-500">
      <Heading title="BROWSE CATEGORIES" />
      <div className="max-w-screen-2xl mx-auto py-10 gap-x-5 px-16 max-md:px-10 gap-y-5 grid grid-cols-5 max-lg:grid-cols-3 max-md:grid-cols-2 max-[450px]:grid-cols-1">
        {categories.map((item) => (
          <CategoryItem
            title={item.name}
            key={item.id}
            href={`/shop/${convertCategoryNameToURLFriendly(item.name)}`}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 p-3 shadow-sm ring-1 ring-slate-200">
              <Image
                src={getCategoryIcon(item.name)}
                width={40}
                height={40}
                alt={item.name}
                className="h-10 w-10 object-contain"
              />
            </div>
          </CategoryItem>
        ))}
      </div>
    </div>
  );
};

export default CategoryMenu;
