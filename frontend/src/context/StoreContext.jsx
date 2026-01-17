import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const StoreContext = createContext(null)

const StoreContextProvider = (props) => {

    const [cartItems, setCartItems] = useState({});
    const url = "http://localhost:4000";
    const [token, setToken] = useState("");
    const [food_list, setFoodList] = useState([])
    const [userId, setUserId] = useState("");

    const addToCart = async (itemId, amount = 1) => {
        if (!token) {
            toast.error("Please sign in to add items to your cart.");
            return;
        }
        setCartItems((prev) => ({
            ...prev,
            [itemId]: (prev[itemId] || 0) + amount
        }));
        try {
            await axios.post(url + "/api/cart/add", { userId, itemId, amount }, { headers: { token } });
        } catch (error) {
            console.error("Error adding to cart:", error);
            toast.error("Failed to add item to cart");
        }
    };

    const removeFromCart = async (itemId, removeAll = false) => {
        if (removeAll) {
            setCartItems((prev) => {
                const updated = { ...prev };
                delete updated[itemId];
                return updated;
            });
            if (token) {
                try {
                    await axios.post(url + "/api/cart/removeAll", { userId, itemId }, { headers: { token } });
                } catch (error) {
                    console.error("Error removing from cart:", error);
                }
            }
        } else {
            setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }));
            if (token) {
                try {
                    await axios.post(url + "/api/cart/remove", { userId, itemId }, { headers: { token } });
                } catch (error) {
                    console.error("Error removing from cart:", error);
                }
            }
        }
    };

    const getTotalCartAmount = () => {
        let totalAmount = 0;

        if (!food_list || !Array.isArray(food_list)) {
            return totalAmount;
        }

        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                const itemInfo = food_list.find((product) => product && product._id === item);
                if (itemInfo && itemInfo.price) {
                    totalAmount += itemInfo.price * cartItems[item];
                }
            }
        }
        return totalAmount;
    }

    const fetchFoodList = async () => {
        try {
            const response = await axios.get(url + "/api/food/list");
            // Make sure data exists and is an array
            if (response.data.success && Array.isArray(response.data.data)) {
                setFoodList(response.data.data);
            } else {
                console.error("Unexpected response format:", response.data);
                setFoodList([]);
            }
        } catch (error) {
            console.error("Error fetching food list:", error);
            setFoodList([]);
        }
    }
    
    const loadCartData = async (token) => {
        try {
            const userId = localStorage.getItem("userId");
            const response = await axios.post(
                url + "/api/cart/get",
                { userId },
                { headers: { token } }
            );
            if (response.data.success) {
                setCartItems(response.data.cartData);
            }
        } catch (error) {
            console.error("Error loading cart data:", error);
        }
    }
    useEffect(() => {
        async function loadData() {
            // Load food list first
            await fetchFoodList();

            const storedToken = localStorage.getItem("token");
            const storedUserId = localStorage.getItem("userId");

            if (storedToken) {
                setToken(storedToken);
                setUserId(storedUserId);
                // Load cart after food list is ready
                await loadCartData(storedToken);
            }
        }
        loadData();
    }, [])

    const contextValue = {
        food_list,
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        getTotalCartAmount,
        url,
        token,
        setToken,
        userId,
        setUserId
    }

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    )
}

export default StoreContextProvider;