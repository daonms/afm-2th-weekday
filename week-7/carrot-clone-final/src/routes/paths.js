export const PATHS = {
  login: "/login",
  signup: "/signup",
  neighborhood: "/neighborhood",
  home: "/",
  productNew: "/products/new",
  productDetail: (id) => `/products/${id}`,
  productEdit: (id) => `/products/${id}/edit`,
  chats: "/chats",
  chatRoom: (roomId) => `/chats/${roomId}`,
  me: "/me",
};
