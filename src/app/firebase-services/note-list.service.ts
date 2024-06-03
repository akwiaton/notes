import { Injectable, inject } from '@angular/core';
import { Note } from '../interfaces/note.interface';
import { query, orderBy, limit, where, Firestore, collection, doc, collectionData, onSnapshot, addDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NoteListService {

  trashNotes: Note[] = [];
  normalNotes: Note[] = [];
  normalMarkedNotes: Note[] = [];

  unsubTrash;
  unsubNotes;
  unsubMarkedNotes;

  firestore: Firestore = inject(Firestore);

  constructor() {
    this.unsubNotes =   this.subNoteList();
    this.unsubMarkedNotes =   this.subMarkednoteList();
    this.unsubTrash =   this.subTrashList();
  }

  async deleteNote(colId: "notes" | "trash", docId:string) {
    await deleteDoc(this.getSingleDocRef(colId, docId)).catch(
      (err) => { console.log(err); }
    )
  }

async updateNote(note: Note) {
if (note.id) {
  let docRef = this.getSingleDocRef(this.getColIdFromNote(note), note.id);
  await updateDoc(docRef, this.getCleanJson(note)).catch(
    (err) => { console.log(err); }
  );
}
}

getCleanJson(note: Note):{} {
  return {
    type: note.type,
    title: note.title,
    content: note.content,
    marked: note.marked
  }
}

getColIdFromNote(note: Note) {
  if (note.type == 'note') {
    return 'notes'
  } else {
    return 'trash'
  }
}

async addNote(item: Note, colId: "notes" | "trash" ) {
  let docRef;
  if (colId == 'trash') {
    docRef = this.getTrashRef();
  } else {
    docRef = this.getNotesRef();
  }
  if (docRef) {
    await addDoc(docRef, item);
  }
//  await addDoc(this.getNotesRef(), item).catch(
//     (err) => { console.log(err)}
//   ).then(
//     (docRef) => {console.log("Document written with ID: ", docRef?.id);}
//   )
  
}
  setNoteObject(obj:any, id:string): Note {
    return {
      id: id,
      type: obj.type || "note",
      title: obj.title || "",
      content: obj.content || "",
      marked: obj.marked || false
    }
  }
  ngonDestroy() {
    this.unsubNotes();
    this.unsubTrash();
    this.unsubMarkedNotes();
  }

  subTrashList() {
    return onSnapshot(this.getTrashRef(), (list)=> {
      this.trashNotes = [];
      list.forEach(element => {
       this.trashNotes.push(this.setNoteObject(element.data(), element.id));
       });
     }); 
  }

  subNoteList() {
    const q = query(this.getNotesRef(), limit(100));
    return onSnapshot(q, (list)=> {
      this.normalNotes = [];
      list.forEach(element => {
      this.normalNotes.push(this.setNoteObject(element.data(), element.id));
       });

       list.docChanges().forEach((change) => {
        if (change.type === "added") {
            console.log("New note: ", change.doc.data());
        }
        if (change.type === "modified") {
            console.log("Modified note: ", change.doc.data());
        }
        if (change.type === "removed") {
            console.log("Removed note: ", change.doc.data());
        }
      });


     }); 
  }

  subMarkednoteList() {
    const q = query(this.getNotesRef(), where("marked", "==", true),  limit(5));
    return onSnapshot(q, (list)=> {
      this.normalMarkedNotes = [];
      list.forEach(element => {
      this.normalMarkedNotes.push(this.setNoteObject(element.data(), element.id));
       });
     }); 
  }

    getNotesRef() {
      return collection(this.firestore, 'notes'); // firestore ist datenbakn, ich hole die sammlung trash
    }
    getTrashRef() {
      return collection(this.firestore, 'trash'); // firestore ist datenbakn, ich hole die sammlung trash
    }

    getSingleDocRef(colId:string, docId:string) {
      return doc(collection(this.firestore, colId), docId);
    }
    
} 
