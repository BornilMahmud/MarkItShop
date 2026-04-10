"use client";

import { useWishlistStore } from "@/app/_zustand/wishlistStore";
import { toDisplayImageSrc } from "@/helpers/image-url";
import { formatBDT } from "@/helpers/currency";
import Image from "next/image";
import Link from "next/link";

interface WishItemProps {
  id: string;
  title: string;
  price: number;
  image: string;
  slug: string;
  stockAvailabillity: number;
}

const WishItem = ({
  id,
  title,
  price,
  image,
  slug,
  stockAvailabillity,
}: WishItemProps) => {
  const { removeFromWishlist } = useWishlistStore();

  return (
    <tr>
      <td>
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => removeFromWishlist(id)}
          aria-label="Remove from wishlist"
        >
          x
        </button>
      </td>
      <td>
        <Image
          src={toDisplayImageSrc(image)}
          alt={title}
          width={64}
          height={64}
          className="mx-auto h-16 w-16 rounded-md object-cover"
        />
      </td>
      <td>
        <Link href={`/product/${slug}`} className="font-medium text-blue-700 hover:underline">
          {title}
        </Link>
        <p className="text-sm text-slate-600">{formatBDT(price)}</p>
      </td>
      <td>
        {stockAvailabillity > 0 ? (
          <span className="badge badge-success text-white">In stock</span>
        ) : (
          <span className="badge badge-error text-white">Out of stock</span>
        )}
      </td>
      <td>
        <Link href={`/product/${slug}`} className="btn btn-sm btn-primary">
          View Product
        </Link>
      </td>
    </tr>
  );
};

export default WishItem;
